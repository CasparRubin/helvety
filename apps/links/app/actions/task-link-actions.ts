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

import type { ActionResponse } from "@/lib/types";

interface LinkedTaskRow {
  id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

interface TaskLinkData {
  items: LinkedTaskRow[];
}

interface TaskEntitiesData {
  items: { id: string; encrypted_title: string }[];
}

export async function getLinkTaskLinks(
  linkId: string
): Promise<ActionResponse<TaskLinkData>> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const linkExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "links",
      linkId
    );
    if (!linkExists) {
      return { success: false, error: "Link not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "links",
      entityId: linkId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError("Error getting task links", linksResult.error);
      return { success: false, error: "Failed to load task links" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "links",
      linkId,
      "items"
    );

    if (references.length === 0) {
      return { success: true, data: { items: [] } };
    }

    const itemIds = references.map((reference) => reference.entity_id);
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
      logger.logUnexpectedError("Error fetching linked tasks", itemsError);
      return { success: false, error: "Failed to load linked tasks" };
    }

    const linkMap = new Map(
      references.map((reference) => [
        reference.entity_id,
        { link_id: reference.link_id, linked_at: reference.linked_at },
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
          .filter((item): item is LinkedTaskRow => item !== null),
      },
    };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getLinkTaskLinks", error);
  }
}

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

export async function linkTaskEntity(
  itemId: string,
  linkId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
    }
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const ownedEntities = await validateOwnedLinkEntities(supabase, user.id, [
      {
        entityType: "items",
        entityId: itemId,
        notFoundMessage: "Task not found",
      },
      {
        entityType: "links",
        entityId: linkId,
        notFoundMessage: "Link not found",
      },
    ]);
    if (!ownedEntities.success) {
      return ownedEntities;
    }

    const linkResult = await createCanonicalLink({
      supabase,
      userId: user.id,
      sourceEntityType: "links",
      sourceEntityId: linkId,
      targetEntityType: "items",
      targetEntityId: itemId,
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
