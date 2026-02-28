"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ENTITY_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { z } from "zod";

import {
  DEFAULT_ITEM_LABEL_ID,
  DEFAULT_LABEL_CONFIG,
} from "@/lib/config/default-labels";
import {
  DEFAULT_ITEM_STAGE_ID,
  DEFAULT_STAGE_CONFIGS,
} from "@/lib/config/default-stages";
import { ATTACHMENT_BUCKET } from "@/lib/constants";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, ItemRow } from "@/lib/types";

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
  space_id: z.string().uuid(),
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
    space_id: string;
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
      return { success: false, error: "Failed to create item" };
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
      return { success: false, error: "Invalid item data" };
    }
    const validatedData = validationResult.data;

    // Verify user owns the space
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", validatedData.space_id)
      .eq("user_id", user.id)
      .single();

    if (spaceError || !space) {
      return { success: false, error: "Space not found" };
    }

    // Enforce per-space Item limit before insert.
    const { count: itemCount, error: countError } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("space_id", validatedData.space_id);
    if (countError) {
      logger.error("Error counting items for space:", countError);
      return { success: false, error: "Failed to create item" };
    }
    if ((itemCount ?? 0) >= ENTITY_LIMITS.MAX_ITEMS_PER_SPACE) {
      return {
        success: false,
        error: `Item limit reached (max ${ENTITY_LIMITS.MAX_ITEMS_PER_SPACE} per space)`,
      };
    }

    // Insert item (stage_id and label_id are NOT NULL in DB; use defaults when omitted)
    const insertObj: Record<string, unknown> = {
      id: validatedData.id,
      space_id: validatedData.space_id,
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

    if (error || !item) {
      logger.error("Error creating item:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
      });
      return { success: false, error: "Failed to create item" };
    }

    return { success: true, data: { id: item.id } };
  } catch (error) {
    logger.error("Unexpected error in createItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Items for a Space
 */
export async function getItems(
  spaceId: string
): Promise<ActionResponse<ItemRow[]>> {
  try {
    if (!z.string().uuid().safeParse(spaceId).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get items (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: items, error } = await supabase
      .from("items")
      .select("*")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<ItemRow[]>();

    if (error) {
      logger.error("Error getting items:", error);
      return { success: false, error: "Failed to get items" };
    }

    return { success: true, data: items ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getItems:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Item by ID
 */
export async function getItem(id: string): Promise<ActionResponse<ItemRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid item ID" };
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
      .returns<ItemRow[]>()
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return { success: false, error: "Item not found" };
      }
      logger.error("Error getting item:", error);
      return { success: false, error: "Failed to get item" };
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
      return { success: false, error: "Invalid item data" };
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
      logger.error("Error updating item:", error);
      return {
        success: false,
        error: error.message ?? "Failed to update item",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete an Item (cascades to all Attachments).
 * Cascading deletes remove attachment rows in Postgres.
 * Storage cleanup for cascaded attachment files is handled separately.
 */
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

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid item ID" };
    }

    // Read storage paths before deleting row so we can clean up blobs.
    const { data: attachments, error: attachmentsError } = await supabase
      .from("item_attachments")
      .select("storage_path")
      .eq("item_id", id)
      .eq("user_id", user.id);
    if (attachmentsError) {
      logger.error(
        "Error fetching item attachments for cleanup:",
        attachmentsError
      );
      return { success: false, error: "Failed to delete item" };
    }

    // Delete item (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting item:", error);
      return { success: false, error: "Failed to delete item" };
    }

    const pathsToDelete = (attachments ?? [])
      .map((row) => row.storage_path)
      .filter(
        (path): path is string => typeof path === "string" && path.length > 0
      );
    if (pathsToDelete.length > 0) {
      const adminClient = createAdminClient();
      const { error: storageError } = await adminClient.storage
        .from(ATTACHMENT_BUCKET)
        .remove(pathsToDelete);
      if (storageError) {
        logger.error(
          "Error deleting cascaded item attachment files:",
          storageError
        );
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteItem:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
