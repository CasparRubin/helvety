"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, ContactRow, ReorderUpdate } from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for category_id - accepts both UUIDs (custom categories) and default category IDs */
const CategoryIdSchema = z
  .union([z.string().uuid(), z.string().startsWith("default-")])
  .nullable()
  .optional();

/** Schema for creating a Contact */
const CreateContactSchema = z.object({
  encrypted_first_name: EncryptedDataSchema,
  encrypted_last_name: EncryptedDataSchema,
  encrypted_email: EncryptedDataSchema.nullable(),
  encrypted_notes: EncryptedDataSchema.nullable(),
  category_id: CategoryIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating a Contact */
const UpdateContactSchema = z.object({
  id: z.string().uuid(),
  encrypted_first_name: EncryptedDataSchema.optional(),
  encrypted_last_name: EncryptedDataSchema.optional(),
  encrypted_email: EncryptedDataSchema.nullable().optional(),
  encrypted_notes: EncryptedDataSchema.nullable().optional(),
  category_id: CategoryIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for batch reorder updates */
const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
    category_id: z
      .union([z.string().uuid(), z.string().startsWith("default-")])
      .nullable()
      .optional(),
  })
);

// =============================================================================
// CONTACT ACTIONS
// =============================================================================

/**
 * Create a new Contact
 * Receives pre-encrypted data from the client
 */
export async function createContact(
  data: {
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_email: string | null;
    encrypted_notes: string | null;
    category_id?: string | null;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = CreateContactSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid contact data:", validationResult.error.format());
      return { success: false, error: "Invalid contact data" };
    }
    const validatedData = validationResult.data;

    // Insert contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        encrypted_first_name: validatedData.encrypted_first_name,
        encrypted_last_name: validatedData.encrypted_last_name,
        encrypted_email: validatedData.encrypted_email,
        encrypted_notes: validatedData.encrypted_notes,
        category_id: validatedData.category_id ?? null,
      })
      .select("id")
      .single();

    if (error || !contact) {
      logger.error("Error creating contact:", error);
      return { success: false, error: "Failed to create contact" };
    }

    return { success: true, data: { id: contact.id } };
  } catch (error) {
    logger.error("Unexpected error in createContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Contacts for the current user
 * Returns encrypted data that must be decrypted client-side
 */
export async function getContacts(): Promise<ActionResponse<ContactRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { supabase } = auth.ctx;

    // Get contacts (RLS ensures only user's own contacts are returned)
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
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
 * Get a single Contact by ID
 */
export async function getContact(
  id: string
): Promise<ActionResponse<ContactRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { supabase } = auth.ctx;

    // Get contact (RLS ensures only user's own contact can be accessed)
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .returns<ContactRow[]>()
      .single();

    if (error || !contact) {
      if (error?.code === "PGRST116" || !contact) {
        return { success: false, error: "Contact not found" };
      }
      logger.error("Error getting contact:", error);
      return { success: false, error: "Failed to get contact" };
    }

    return { success: true, data: contact };
  } catch (error) {
    logger.error("Unexpected error in getContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Contact
 */
export async function updateContact(
  data: {
    id: string;
    encrypted_first_name?: string;
    encrypted_last_name?: string;
    encrypted_email?: string | null;
    encrypted_notes?: string | null;
    category_id?: string | null;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = UpdateContactSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid contact update data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid contact data" };
    }
    const validatedData = validationResult.data;

    // Build update object (only include provided fields)
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_first_name !== undefined) {
      updateObj.encrypted_first_name = validatedData.encrypted_first_name;
    }
    if (validatedData.encrypted_last_name !== undefined) {
      updateObj.encrypted_last_name = validatedData.encrypted_last_name;
    }
    if (validatedData.encrypted_email !== undefined) {
      updateObj.encrypted_email = validatedData.encrypted_email;
    }
    if (validatedData.encrypted_notes !== undefined) {
      updateObj.encrypted_notes = validatedData.encrypted_notes;
    }
    if (validatedData.category_id !== undefined) {
      updateObj.category_id = validatedData.category_id;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update contact (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("contacts")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating contact:", error);
      return { success: false, error: "Failed to update contact" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Contact
 */
export async function deleteContact(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    // Delete contact (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting contact:", error);
      return { success: false, error: "Failed to delete contact" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteContact:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch update sort_order (and optionally category_id) for multiple contacts
 * Used during drag-and-drop reordering
 */
export async function reorderContacts(
  updates: ReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = ReorderSchema.safeParse(updates);
    if (!validationResult.success) {
      logger.warn("Invalid reorder data:", validationResult.error.format());
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    if (validatedUpdates.length === 0) {
      return { success: true };
    }

    // Batch update all contacts in parallel for better performance
    const now = new Date().toISOString();
    const results = await Promise.all(
      validatedUpdates.map((update) => {
        const updateObj: Record<string, unknown> = {
          sort_order: update.sort_order,
          updated_at: now,
        };
        if (update.category_id !== undefined) {
          updateObj.category_id = update.category_id;
        }

        return supabase
          .from("contacts")
          .update(updateObj)
          .eq("id", update.id)
          .eq("user_id", user.id);
      })
    );

    const failedResult = results.find((r) => r.error);
    if (failedResult?.error) {
      logger.error("Error reordering contact:", failedResult.error);
      return { success: false, error: "Failed to reorder contacts" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderContacts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
