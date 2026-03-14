"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ENTITY_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, ItemRow } from "@/lib/types";

/** Revalidate item routes impacted by structural item mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/notes");
}

/** Canonical backing table for Notes app items. */
const NOTES_ITEMS_TABLE = "notes" as const;
const MAX_ITEMS_PER_USER = ENTITY_LIMITS.MAX_NOTES_PER_USER;

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for creating an Item */
const CreateItemSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating an Item */
const UpdateItemSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

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
    const validationResult = CreateItemSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid item data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid note data" };
    }
    const validatedData = validationResult.data;
    // Enforce per-user Item limit before insert.
    const { count: itemCount, error: countError } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) {
      logger.error("Error counting items for user:", countError);
      return { success: false, error: "Failed to create note" };
    }
    if ((itemCount ?? 0) >= MAX_ITEMS_PER_USER) {
      return {
        success: false,
        error: `Note limit reached (max ${MAX_ITEMS_PER_USER} per account)`,
      };
    }

    // Insert item row into notes table (Notes app canonical store).
    const insertObj: Record<string, unknown> = {
      id: validatedData.id,
      user_id: user.id,
      encrypted_title: validatedData.encrypted_title,
      encrypted_description: validatedData.encrypted_description,
    };

    const { data: item, error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .insert(insertObj)
      .select("id")
      .single();

    if (error || !item) {
      logger.error("Error creating item:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });
      return { success: false, error: "Failed to create note" };
    }

    revalidateItemRoutes();
    return { success: true, data: { id: item.id } };
  } catch (error) {
    logger.error("Unexpected error in createItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Items for the current user (flat list).
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
      .returns<ItemRow[]>();

    if (error) {
      logger.error("Error getting all items:", error);
      return { success: false, error: "Failed to get notes" };
    }

    return { success: true, data: items ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getAllItems:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Item by ID
 */
export async function getItem(id: string): Promise<ActionResponse<ItemRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
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
      .returns<ItemRow[]>()
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return { success: false, error: "Note not found" };
      }
      logger.error("Error getting item:", error);
      return { success: false, error: "Failed to get note" };
    }

    return { success: true, data: item };
  } catch (error) {
    logger.error("Unexpected error in getItem:", error);
    return { success: false, error: "An unexpected error occurred" };
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
    const validationResult = UpdateItemSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid item update data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid note data" };
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

    // Update item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating item:", error);
      return {
        success: false,
        error: "Failed to update note",
      };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateItem:", error);
    return { success: false, error: "An unexpected error occurred" };
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

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid note ID" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(NOTES_ITEMS_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting item:", error);
      return { success: false, error: "Failed to delete note" };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
