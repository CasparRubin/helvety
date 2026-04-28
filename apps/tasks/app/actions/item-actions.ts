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

import {
  DEFAULT_ITEM_LABEL_ID,
  DEFAULT_LABEL_CONFIG,
} from "@/lib/config/default-labels";
import {
  DEFAULT_ITEM_STAGE_ID,
  DEFAULT_STAGE_CONFIGS,
} from "@/lib/config/default-stages";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse } from "@/lib/types";

/** Revalidate task routes after item mutations. */
function revalidateItemRoutes(): void {
  revalidatePath("/tasks");
}

/** Canonical backing table for Tasks app items. */
const TASKS_ITEMS_TABLE = "items" as const;

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
const CreateItemSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema,
    encrypted_description: EncryptedDataSchema.nullable(),
    encrypted_start_date: EncryptedDataSchema.nullable(),
    encrypted_end_date: EncryptedDataSchema.nullable(),
    stage_id: StageIdSchema,
    label_id: LabelIdSchema,
    priority: PrioritySchema,
    sort_order: z.number().int().min(0).optional(),
  })
  .strict();

/** Schema for updating an Item */
const UpdateItemSchema = z
  .object({
    id: z.string().uuid(),
    encrypted_title: EncryptedDataSchema.optional(),
    encrypted_description: EncryptedDataSchema.nullable().optional(),
    encrypted_start_date: EncryptedDataSchema.nullable().optional(),
    encrypted_end_date: EncryptedDataSchema.nullable().optional(),
    stage_id: StageIdSchema,
    label_id: LabelIdSchema,
    priority: PrioritySchema,
    sort_order: z.number().int().min(0).optional(),
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
    const validationResult = parseActionInput({
      schema: CreateItemSchema,
      data,
      warnMessage: "Invalid item data",
      invalidDataMessage: "Invalid task data",
    });
    if (!validationResult.success) {
      return validationResult;
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
      .from(TASKS_ITEMS_TABLE)
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
    const validationResult = parseActionInput({
      schema: UpdateItemSchema,
      data,
      warnMessage: "Invalid item update data",
      invalidDataMessage: "Invalid task data",
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
      .from(TASKS_ITEMS_TABLE)
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
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!isUuidString(id)) {
      return { success: false, error: "Invalid task ID" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from(TASKS_ITEMS_TABLE)
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
    return unexpectedActionError("Unexpected error in deleteItem", error);
  }
}
