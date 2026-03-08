"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
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
 * Get all contact links for a specific item.
 */
export async function getItemContactLinks(
  itemId: string
): Promise<ActionResponse<ItemContactLinkRow[]>> {
  try {
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: links, error } = await supabase
      .from("item_contact_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .order("created_at", { ascending: true })
      .returns<ItemContactLinkRow[]>();

    if (error) {
      logger.error("Error getting contact links:", error);
      return { success: false, error: "Failed to get contact links" };
    }

    return { success: true, data: links ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getItemContactLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a contact to an item.
 */
export async function linkContact(
  itemId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
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

    const [contactResult, itemResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("id")
        .eq("id", contactId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("items")
        .select("id")
        .eq("id", itemId)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (contactResult.error || !contactResult.data) {
      return { success: false, error: "Contact not found" };
    }
    if (itemResult.error || !itemResult.data) {
      return { success: false, error: "Item not found" };
    }

    const { data: link, error } = await supabase
      .from("item_contact_links")
      .insert({
        item_id: itemId,
        contact_id: contactId,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !link) {
      if (error?.code === "23505") {
        return { success: false, error: "Contact is already linked" };
      }
      logger.error("Error linking contact:", error);
      return { success: false, error: "Failed to link contact" };
    }

    return { success: true, data: { id: link.id } };
  } catch (error) {
    logger.error("Unexpected error in linkContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Unlink a contact from an item by deleting the link row.
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

    const { error } = await supabase
      .from("item_contact_links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error unlinking contact:", error);
      return { success: false, error: "Failed to unlink contact" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
