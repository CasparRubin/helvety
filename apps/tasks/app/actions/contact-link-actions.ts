"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";

import type {
  ActionResponse,
  ContactRow,
  EntityContactLinkRow,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

const EntityTypeSchema = z.enum(["unit", "space", "item"]);

// =============================================================================
// CONTACT ACTIONS (read-only, contacts are managed in the Contacts app)
// =============================================================================

/**
 * Get all Contacts for the current user.
 * Returns encrypted data that must be decrypted client-side.
 * The Tasks app only reads contacts and never creates or edits them.
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

// =============================================================================
// ENTITY CONTACT LINK ACTIONS
// =============================================================================

/**
 * Get all contact links for a specific entity (unit, space, or item).
 * Returns link rows that reference contact IDs.
 */
export async function getEntityContactLinks(
  entityType: string,
  entityId: string
): Promise<ActionResponse<EntityContactLinkRow[]>> {
  try {
    if (!EntityTypeSchema.safeParse(entityType).success) {
      return { success: false, error: "Invalid entity type" };
    }
    if (!z.string().uuid().safeParse(entityId).success) {
      return { success: false, error: "Invalid entity ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: links, error } = await supabase
      .from("entity_contact_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true })
      .returns<EntityContactLinkRow[]>();

    if (error) {
      logger.error("Error getting contact links:", error);
      return { success: false, error: "Failed to get contact links" };
    }

    return { success: true, data: links ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getEntityContactLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a contact to an entity (unit, space, or item).
 */
export async function linkContact(
  entityType: string,
  entityId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!EntityTypeSchema.safeParse(entityType).success) {
      return { success: false, error: "Invalid entity type" };
    }
    if (!z.string().uuid().safeParse(entityId).success) {
      return { success: false, error: "Invalid entity ID" };
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

    const entityTable =
      entityType === "unit"
        ? "units"
        : entityType === "space"
          ? "spaces"
          : "items";

    // Verify ownership of both contact and entity in parallel (defense-in-depth)
    const [contactResult, entityResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("id")
        .eq("id", contactId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from(entityTable)
        .select("id")
        .eq("id", entityId)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (contactResult.error || !contactResult.data) {
      return { success: false, error: "Contact not found" };
    }

    if (entityResult.error || !entityResult.data) {
      return { success: false, error: "Entity not found" };
    }

    const { data: link, error } = await supabase
      .from("entity_contact_links")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        contact_id: contactId,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !link) {
      // Handle unique constraint violation (contact already linked)
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
 * Unlink a contact from an entity by deleting the link row.
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

    // Delete link (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("entity_contact_links")
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
