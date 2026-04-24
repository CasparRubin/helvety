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
import { isUuidString } from "@helvety/shared/uuid-string";

import type { ActionResponse, ContactRow } from "@/lib/types";

/** Raw link row from `note_contact_links`. */
interface ItemContactLinkRow {
  id: string;
  note_id: string;
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
      .overrideTypes<ContactRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting contacts", error);
      return { success: false, error: "Failed to get contacts" };
    }

    return { success: true, data: contacts ?? [] };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getContacts", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all contact links for a specific note.
 */
export async function getItemContactLinks(
  itemId: string
): Promise<ActionResponse<ItemContactLinkRow[]>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "notes",
      entityId: itemId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError(
        "Error getting contact links",
        linksResult.error
      );
      return { success: false, error: "Failed to get contact links" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "notes",
      itemId,
      "contacts"
    );

    const rows: ItemContactLinkRow[] = references.map((reference) => ({
      id: reference.link_id,
      note_id: itemId,
      contact_id: reference.entity_id,
      user_id: user.id,
      created_at: reference.linked_at,
    }));

    return { success: true, data: rows };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getItemContactLinks", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a contact to a note.
 */
export async function linkContact(
  itemId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid note ID" };
    }
    if (!isUuidString(contactId)) {
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
      ensureOwnedEntityExists(supabase, user.id, "notes", itemId),
    ]);

    if (!contactExists) {
      return { success: false, error: "Contact not found" };
    }
    if (!itemExists) {
      return { success: false, error: "Note not found" };
    }

    const linkResult = await createEntityLink({
      supabase,
      userId: user.id,
      sourceEntityType: "notes",
      sourceEntityId: itemId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
    });

    if (linkResult.error || !linkResult.data) {
      if (linkResult.error?.code === "23505") {
        return { success: false, error: "Contact is already linked" };
      }
      logger.logUnexpectedError("Error linking contact", linkResult.error);
      return { success: false, error: "Failed to link contact" };
    }

    return { success: true, data: { id: linkResult.data.id } };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in linkContact", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Unlink a contact from a note by deleting the link row.
 */
export async function unlinkContact(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!isUuidString(linkId)) {
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
      logger.logUnexpectedError("Error unlinking contact", deleteResult.error);
      return { success: false, error: "Failed to unlink contact" };
    }

    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in unlinkContact", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
