"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  assignDefinedField,
  ownedUpdateMissingRow,
} from "@helvety/shared/entity-action-primitives";
import { logger } from "@helvety/shared/logger";
import {
  parseActionInput,
  unexpectedActionError,
} from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { EncryptedDataSchema } from "@helvety/shared/validation/encrypted-data";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ALLOWED_NOTE_CATEGORY_IDS } from "@/lib/config/default-note-categories";

import type { ActionResponse } from "@/lib/types";

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
    assignDefinedField(
      updateObj,
      "encrypted_title",
      validatedData.encrypted_title
    );
    assignDefinedField(
      updateObj,
      "encrypted_description",
      validatedData.encrypted_description
    );
    assignDefinedField(updateObj, "sort_order", validatedData.sort_order);
    assignDefinedField(updateObj, "category_id", validatedData.category_id);

    // Update item (RLS + explicit user_id check for defense-in-depth)
    const { data: updatedRow, error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      logger.logUnexpectedError("Error updating item", error);
      return {
        success: false,
        error: "Failed to update note",
      };
    }

    const missingRow = ownedUpdateMissingRow(updatedRow, "Note not found");
    if (missingRow) {
      return missingRow;
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
