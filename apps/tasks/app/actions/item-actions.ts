"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { isUuidString } from "@helvety/shared/uuid-string";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DEFAULT_ITEM_LABEL_ID,
  DEFAULT_LABEL_CONFIG,
} from "@/lib/config/default-labels";
import {
  DEFAULT_ITEM_STAGE_ID,
  DEFAULT_STAGE_CONFIGS,
} from "@/lib/config/default-stages";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, ItemRow } from "@/lib/types";

/** Revalidate item routes impacted by structural item mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/tasks");
}

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for stage_id - accepts only built-in default item stage IDs */
const ALLOWED_ITEM_STAGE_IDS = DEFAULT_STAGE_CONFIGS.item.stages.map(
  (stage) => stage.id
) as [string, ...string[]];
const StageIdSchema = z.enum(ALLOWED_ITEM_STAGE_IDS).nullable().optional();

/** Schema for label_id - accepts only built-in default item label IDs */
const ALLOWED_ITEM_LABEL_IDS = DEFAULT_LABEL_CONFIG.labels.map(
  (label) => label.id
) as [string, ...string[]];
const LabelIdSchema = z.enum(ALLOWED_ITEM_LABEL_IDS).nullable().optional();

/** Priority validation: smallint 0-3 */
const PrioritySchema = z.number().int().min(0).max(3).optional();

/** Schema for creating an Item */
const CreateItemSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  encrypted_start_date: EncryptedDataSchema.nullable(),
  encrypted_end_date: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  label_id: LabelIdSchema,
  priority: PrioritySchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating an Item */
const UpdateItemSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  encrypted_start_date: EncryptedDataSchema.nullable().optional(),
  encrypted_end_date: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  label_id: LabelIdSchema,
  priority: PrioritySchema,
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
    encrypted_start_date: string | null;
    encrypted_end_date: string | null;
    stage_id?: string | null;
    label_id?: string | null;
    priority?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!DEFAULT_ITEM_STAGE_ID) {
      logger.error("Missing default item stage configuration");
      return { success: false, error: "Failed to create task" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
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
      return { success: false, error: "Invalid task data" };
    }
    const validatedData = validationResult.data;
    // Insert item (stage_id and label_id are NOT NULL in DB; use defaults when omitted)
    const insertObj: Record<string, unknown> = {
      id: validatedData.id,
      user_id: user.id,
      encrypted_title: validatedData.encrypted_title,
      encrypted_description: validatedData.encrypted_description,
      encrypted_start_date: validatedData.encrypted_start_date,
      encrypted_end_date: validatedData.encrypted_end_date,
      stage_id: validatedData.stage_id ?? DEFAULT_ITEM_STAGE_ID,
      label_id: validatedData.label_id ?? DEFAULT_ITEM_LABEL_ID,
    };
    if (validatedData.priority !== undefined) {
      insertObj.priority = validatedData.priority;
    }

    const { data: item, error } = await supabase
      .from("items")
      .insert(insertObj)
      .select("id")
      .single();

    if (error) {
      logger.logUnexpectedError("Error creating item", error);
      return { success: false, error: "Failed to create task" };
    }
    if (!item) {
      logger.logUnexpectedError(
        "Error creating item",
        new Error("Insert succeeded but no row returned")
      );
      return { success: false, error: "Failed to create task" };
    }

    revalidateItemRoutes();
    return { success: true, data: { id: item.id } };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in createItem", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all tasks for the current user, ordered by `sort_order` (newest tie-break on `created_at`).
 */
export async function getAllItems(): Promise<ActionResponse<ItemRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .overrideTypes<ItemRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting all items", error);
      return { success: false, error: "Failed to get tasks" };
    }

    return { success: true, data: items ?? [] };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getAllItems", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Item by ID
 */
export async function getItem(id: string): Promise<ActionResponse<ItemRow>> {
  try {
    if (!isUuidString(id)) {
      return { success: false, error: "Invalid task ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get item (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return { success: false, error: "Task not found" };
      }
      logger.logUnexpectedError("Error getting item", error);
      return { success: false, error: "Failed to get task" };
    }

    return { success: true, data: item };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getItem", error);
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
    encrypted_start_date?: string | null;
    encrypted_end_date?: string | null;
    stage_id?: string | null;
    label_id?: string | null;
    priority?: number;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
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
      return { success: false, error: "Invalid task data" };
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
    if (validatedData.encrypted_start_date !== undefined) {
      updateObj.encrypted_start_date = validatedData.encrypted_start_date;
    }
    if (validatedData.encrypted_end_date !== undefined) {
      updateObj.encrypted_end_date = validatedData.encrypted_end_date;
    }
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.label_id !== undefined) {
      updateObj.label_id = validatedData.label_id;
    }
    if (validatedData.priority !== undefined) {
      updateObj.priority = validatedData.priority;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("items")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error updating item", error);
      return {
        success: false,
        error: "Failed to update task",
      };
    }

    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in updateItem", error);
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
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid task ID" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error deleting item", error);
      return { success: false, error: "Failed to delete task" };
    }

    revalidateItemRoutes();
    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in deleteItem", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
