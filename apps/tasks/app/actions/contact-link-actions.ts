"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { CONTACT_LINK_PICKER_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
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

/** Lightweight encrypted contact row used for task link pickers. */
interface ContactPickerRow {
  id: string;
  user_id: string;
  encrypted_first_name: string;
  encrypted_last_name: string;
  encrypted_email: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Raw link row from `entity_links`. */
interface ItemContactLinkRow {
  id: string;
  item_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Get up to {@link ACTION_LIMITS.MAX_DASHBOARD_ROWS} contacts for the link picker.
 * Returns encrypted data that must be decrypted client-side.
 */
export async function getContacts(): Promise<
  ActionResponse<ContactPickerRow[]>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select(CONTACT_LINK_PICKER_COLUMNS)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS)
      .overrideTypes<ContactPickerRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting contacts", error);
      return { success: false, error: "Failed to load contacts" };
    }

    return { success: true, data: contacts ?? [] };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getContacts", error);
  }
}

/**
 * Get all contact links for a specific task.
 */
export async function getItemContactLinks(
  itemId: string
): Promise<ActionResponse<ItemContactLinkRow[]>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const itemExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "items",
      itemId
    );
    if (!itemExists) {
      return { success: false, error: "Task not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "items",
      entityId: itemId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError(
        "Error getting contact links",
        linksResult.error
      );
      return { success: false, error: "Failed to load contact links" };
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
    return unexpectedActionError(
      "Unexpected error in getItemContactLinks",
      error
    );
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
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
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
      duplicateMessage: "Contact is already linked",
      failureMessage: "Failed to link contact",
    });

    if (!linkResult.success) {
      if (linkResult.logError) {
        logger.logUnexpectedError("Error linking contact", linkResult.logError);
      }
      return { success: false, error: linkResult.error };
    }

    return { success: true, data: { id: linkResult.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in linkContact", error);
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
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteCanonicalLink(
      supabase,
      user.id,
      linkId,
      "Failed to unlink contact"
    );
    if (!deleteResult.success) {
      if (deleteResult.logError) {
        logger.logUnexpectedError(
          "Error unlinking contact",
          deleteResult.logError
        );
      }
      return { success: false, error: deleteResult.error };
    }

    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in unlinkContact", error);
  }
}
