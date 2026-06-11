"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  createCanonicalLink,
  deleteCanonicalLink,
  validateOwnedLinkEntities,
} from "@helvety/shared/entity-link-action-primitives";
import {
  ensureOwnedEntityExists,
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
} from "@helvety/shared/entity-links";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";

import type {
  ActionResponse,
  ItemContactLinkRow,
  TaskLinkData,
  TaskEntitiesData,
} from "@/lib/types";

/**
 * Get all linked tasks for a specific contact.
 */
export async function getContactTaskLinks(
  contactId: string
): Promise<ActionResponse<TaskLinkData>> {
  try {
    if (!isUuidString(contactId)) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const contactExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "contacts",
      contactId
    );

    if (!contactExists) {
      return { success: false, error: "Contact not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "contacts",
      entityId: contactId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError("Error getting task links", linksResult.error);
      return { success: false, error: "Failed to load task links" };
    }

    const links = toLinkedEntityReferences(
      linksResult.data ?? [],
      "contacts",
      contactId,
      "items"
    ).map<ItemContactLinkRow>((reference) => ({
      id: reference.link_id,
      item_id: reference.entity_id,
      contact_id: contactId,
      user_id: user.id,
      created_at: reference.linked_at,
    }));

    if (!links || links.length === 0) {
      return { success: true, data: { items: [] } };
    }

    const itemIds = links.map((link) => link.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, encrypted_title")
      .in("id", itemIds)
      .eq("user_id", user.id)
      .overrideTypes<
        { id: string; encrypted_title: string }[],
        { merge: false }
      >();

    if (itemsError) {
      logger.logUnexpectedError("Error fetching linked items", itemsError);
      return { success: false, error: "Failed to load linked items" };
    }

    const linkMap = new Map(
      links.map((link) => [
        link.item_id,
        { link_id: link.id, linked_at: link.created_at },
      ])
    );

    return {
      success: true,
      data: {
        items: (items ?? [])
          .map((item) => {
            const link = linkMap.get(item.id);
            if (!link) return null;
            return {
              id: item.id,
              encrypted_title: item.encrypted_title,
              link_id: link.link_id,
              linked_at: link.linked_at,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getContactTaskLinks",
      error
    );
  }
}

/**
 * Get all tasks for linking picker (encrypted titles).
 */
export async function getTaskEntities(): Promise<
  ActionResponse<TaskEntitiesData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await supabase
      .from("items")
      .select(ENCRYPTED_PREFETCH_COLUMNS.items)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS)
      .overrideTypes<
        { id: string; encrypted_title: string }[],
        { merge: false }
      >();

    if (error) {
      logger.logUnexpectedError("Error fetching tasks", error);
      return { success: false, error: "Failed to load tasks" };
    }

    return { success: true, data: { items: items ?? [] } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getTaskEntities", error);
  }
}

/**
 * Link a task to a contact.
 */
export async function linkTaskEntity(
  itemId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
    }
    if (!isUuidString(contactId)) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const ownedEntities = await validateOwnedLinkEntities(supabase, user.id, [
      {
        entityType: "contacts",
        entityId: contactId,
        notFoundMessage: "Contact not found",
      },
      {
        entityType: "items",
        entityId: itemId,
        notFoundMessage: "Task not found",
      },
    ]);
    if (!ownedEntities.success) {
      return ownedEntities;
    }

    const linkResult = await createCanonicalLink({
      supabase,
      userId: user.id,
      sourceEntityType: "items",
      sourceEntityId: itemId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
      duplicateMessage: "Task is already linked",
      failureMessage: "Failed to link task",
    });

    if (!linkResult.success) {
      if (linkResult.logError) {
        logger.logUnexpectedError(
          "Error linking task item",
          linkResult.logError
        );
      }
      return { success: false, error: linkResult.error };
    }

    return { success: true, data: { id: linkResult.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in linkTaskEntity", error);
  }
}

/**
 * Unlink a task from a contact.
 */
export async function unlinkTaskEntity(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteCanonicalLink(
      supabase,
      user.id,
      linkId,
      "Failed to unlink task"
    );
    if (!deleteResult.success) {
      if (deleteResult.logError) {
        logger.logUnexpectedError(
          "Error unlinking task item",
          deleteResult.logError
        );
      }
      return { success: false, error: deleteResult.error };
    }

    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in unlinkTaskEntity", error);
  }
}
