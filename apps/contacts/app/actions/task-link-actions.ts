"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  createEntityLink,
  deleteEntityLink,
  ensureOwnedEntityExists,
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
} from "@helvety/shared/entity-links";
import { logger } from "@helvety/shared/logger";
import { z } from "zod";

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
    if (!z.string().uuid().safeParse(contactId).success) {
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
      logger.error("Error getting task links:", linksResult.error);
      return { success: false, error: "Failed to get task links" };
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
      .returns<{ id: string; encrypted_title: string }[]>();

    if (itemsError) {
      logger.error("Error fetching linked items:", itemsError);
      return { success: false, error: "Failed to fetch linked items" };
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
    logger.error("Unexpected error in getContactTaskLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
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
      .select("id, encrypted_title")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .returns<{ id: string; encrypted_title: string }[]>();

    if (error) {
      logger.error("Error fetching tasks:", error);
      return { success: false, error: "Failed to fetch tasks" };
    }

    return { success: true, data: { items: items ?? [] } };
  } catch (error) {
    logger.error("Unexpected error in getTaskEntities:", error);
    return { success: false, error: "An unexpected error occurred" };
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
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid task ID" };
    }
    if (!z.string().uuid().safeParse(contactId).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [contactExists, itemExists] = await Promise.all([
      ensureOwnedEntityExists(supabase, user.id, "contacts", contactId),
      ensureOwnedEntityExists(supabase, user.id, "items", itemId),
    ]);

    if (!contactExists) {
      return { success: false, error: "Contact not found" };
    }
    if (!itemExists) {
      return { success: false, error: "Task not found" };
    }

    const linkResult = await createEntityLink({
      supabase,
      userId: user.id,
      sourceEntityType: "items",
      sourceEntityId: itemId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
    });

    if (linkResult.error || !linkResult.data) {
      if (linkResult.error?.code === "23505") {
        return { success: false, error: "Task is already linked" };
      }
      logger.error("Error linking task item:", linkResult.error);
      return { success: false, error: "Failed to link task" };
    }

    return { success: true, data: { id: linkResult.data.id } };
  } catch (error) {
    logger.error("Unexpected error in linkTaskEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
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
    if (!z.string().uuid().safeParse(linkId).success) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteEntityLink(supabase, user.id, linkId);

    if (deleteResult.error) {
      logger.error("Error unlinking task item:", deleteResult.error);
      return { success: false, error: "Failed to unlink task" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkTaskEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
