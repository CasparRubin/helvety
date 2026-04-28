"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ALLOWED_NOTE_CATEGORY_IDS } from "@/lib/config/default-note-categories";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, ItemRow } from "@/lib/types";

const NoteCategoryIdSchema = z.enum(ALLOWED_NOTE_CATEGORY_IDS);

/** Revalidate notes routes after item mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/notes");
}

/** Canonical backing table for Notes app items. */
const NOTES_ITEMS_TABLE = "notes" as const;

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for creating an Item */
const CreateItemSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema,
    encrypted_description: EncryptedDataSchema.nullable(),
    sort_order: z.number().int().min(0).optional(),
    category_id: NoteCategoryIdSchema.optional(),
  })
  .strict();

/** Schema for updating an Item */
const UpdateItemSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema.optional(),
    encrypted_description: EncryptedDataSchema.nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    category_id: NoteCategoryIdSchema.optional(),
  })
  .strict();

// =============================================================================
// ITEM ACTIONS
// =============================================================================

/**
 * Create a new Item
 */
export async function createItem(
  data: {
    id: string;
    encrypted_title: string;
    encrypted_description: string | null;
    category_id?: string;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "notes",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = parseActionInput({
      schema: CreateItemSchema,
      data,
      warnMessage: "Invalid item data",
      invalidDataMessage: "Invalid note data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;
    // Insert item row into notes table (Notes app canonical store).
    const insertObj: Record<string, unknown> = {
      id: validatedData.id,
      user_id: user.id,
      encrypted_title: validatedData.encrypted_title,
      encrypted_description: validatedData.encrypted_description,
    };
    if (validatedData.category_id !== undefined) {
      insertObj.category_id = validatedData.category_id;
    }

    const { data: item, error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .insert(insertObj)
      .select("id")
      .single();

    if (error) {
      logger.logUnexpectedError("Error creating item", error);
      return { success: false, error: "Failed to create note" };
    }
    if (!item) {
      logger.logUnexpectedError(
        "Error creating item",
        new Error("Insert succeeded but no row returned")
      );
      return { success: false, error: "Failed to create note" };
    }

    revalidateItemRoutes();
    return { success: true, data: { id: item.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in createItem", error);
  }
}

/**
 * Get all notes for the current user, ordered by `sort_order` (newest tie-break on `created_at`).
 */
export async function getAllItems(): Promise<ActionResponse<ItemRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .overrideTypes<ItemRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting all items", error);
      return { success: false, error: "Failed to get notes" };
    }

    return { success: true, data: items ?? [] };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getAllItems", error);
  }
}

/**
 * Get a single Item by ID
 */
export async function getItem(id: string): Promise<ActionResponse<ItemRow>> {
  try {
    if (!isUuidString(id)) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get item (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: item, error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return { success: false, error: "Note not found" };
      }
      logger.logUnexpectedError("Error getting item", error);
      return { success: false, error: "Failed to get note" };
    }

    return { success: true, data: item };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getItem", error);
  }
}

/**
 * Update an Item
 */
export async function updateItem(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_description?: string | null;
    sort_order?: number;
    category_id?: string;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "notes",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = parseActionInput({
      schema: UpdateItemSchema,
      data,
      warnMessage: "Invalid item update data",
      invalidDataMessage: "Invalid note data",
    });
    if (!validationResult.success) {
      return validationResult;
    }
    const validatedData = validationResult.data;

    // Build update object
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_title !== undefined) {
      updateObj.encrypted_title = validatedData.encrypted_title;
    }
    if (validatedData.encrypted_description !== undefined) {
      updateObj.encrypted_description = validatedData.encrypted_description;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }
    if (validatedData.category_id !== undefined) {
      updateObj.category_id = validatedData.category_id;
    }

    // Update item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating item", error);
      return {
        success: false,
        error: "Failed to update note",
      };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in updateItem", error);
  }
}

/** Delete an Item. */
export async function deleteItem(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "notes",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid note ID" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting item", error);
      return { success: false, error: "Failed to delete note" };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in deleteItem", error);
  }
}
