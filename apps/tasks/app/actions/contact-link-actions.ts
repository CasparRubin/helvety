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

import type { ActionResponse, ContactRow } from "@/lib/types";

/** Raw link row from `item_contact_links`. */
interface ItemContactLinkRow {
  id: string;
  item_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Get all Contacts for the current user.
 * Returns encrypted data that must be decrypted client-side.
 */
export async function getContacts(): Promise<ActionResponse<ContactRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<ContactRow[]>();

    if (error) {
      logger.error("Error getting contacts:", error);
      return { success: false, error: "Failed to get contacts" };
    }

    return { success: true, data: contacts ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getContacts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all contact links for a specific task.
 */
export async function getItemContactLinks(
  itemId: string
): Promise<ActionResponse<ItemContactLinkRow[]>> {
  try {
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid task ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "items",
      entityId: itemId,
    });

    if (linksResult.error) {
      logger.error("Error getting contact links:", linksResult.error);
      return { success: false, error: "Failed to get contact links" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "items",
      itemId,
      "contacts"
    );

    const rows: ItemContactLinkRow[] = references.map((reference) => ({
      id: reference.link_id,
      item_id: itemId,
      contact_id: reference.entity_id,
      user_id: user.id,
      created_at: reference.linked_at,
    }));

    return { success: true, data: rows };
  } catch (error) {
    logger.error("Unexpected error in getItemContactLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a contact to a task.
 */
export async function linkContact(
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
      rateLimitPrefix: "contact-links",
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
        return { success: false, error: "Contact is already linked" };
      }
      logger.error("Error linking contact:", linkResult.error);
      return { success: false, error: "Failed to link contact" };
    }

    return { success: true, data: { id: linkResult.data.id } };
  } catch (error) {
    logger.error("Unexpected error in linkContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Unlink a contact from a task by deleting the link row.
 */
export async function unlinkContact(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!z.string().uuid().safeParse(linkId).success) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteEntityLink(supabase, user.id, linkId);

    if (deleteResult.error) {
      logger.error("Error unlinking contact:", deleteResult.error);
      return { success: false, error: "Failed to unlink contact" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
