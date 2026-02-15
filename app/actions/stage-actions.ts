"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type {
  ActionResponse,
  StageConfigRow,
  StageRow,
  StageAssignment,
  EntityType,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

const EntityTypeSchema = z.enum(["unit", "space", "item"]);

const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional();

// Lucide icon name validation (lowercase with hyphens, e.g., "check-circle")
const IconNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/)
  .max(50)
  .optional();

const CreateStageConfigSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema,
});

const UpdateStageConfigSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
});

const CreateStageSchema = z.object({
  id: z.string().uuid(),
  config_id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema,
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).default(0),
  default_rows_shown: z.number().int().min(0).max(1000).default(20),
});

const UpdateStageSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).optional(),
  default_rows_shown: z.number().int().min(0).max(1000).optional(),
});

const ReorderStagesSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  )
  .max(100, "Too many stages to reorder");

// =============================================================================
// STAGE CONFIG ACTIONS
// =============================================================================

/**
 * Create a new StageConfig
 */
export async function createStageConfig(
  data: { id: string; encrypted_name: string },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = CreateStageConfigSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid stage config data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid stage config data" };
    }
    const validatedData = validationResult.data;

    const { data: config, error } = await supabase
      .from("stage_configs")
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
      })
      .select("id")
      .single();

    if (error || !config) {
      logger.error("Error creating stage config:", error);
      return { success: false, error: "Failed to create stage config" };
    }

    return { success: true, data: { id: config.id } };
  } catch (error) {
    logger.error("Unexpected error in createStageConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all StageConfigs for the current user
 */
export async function getStageConfigs(): Promise<
  ActionResponse<StageConfigRow[]>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "stages" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: configs, error } = await supabase
      .from("stage_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<StageConfigRow[]>();

    if (error) {
      logger.error("Error getting stage configs:", error);
      return { success: false, error: "Failed to get stage configs" };
    }

    return { success: true, data: configs ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getStageConfigs:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a StageConfig
 */
export async function updateStageConfig(
  data: { id: string; encrypted_name?: string },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = UpdateStageConfigSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid stage config data" };
    }
    const validatedData = validationResult.data;

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_name !== undefined) {
      updateObj.encrypted_name = validatedData.encrypted_name;
    }

    const { error } = await supabase
      .from("stage_configs")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating stage config:", error);
      return { success: false, error: "Failed to update stage config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateStageConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a StageConfig (cascades to stages and assignments)
 */
export async function deleteStageConfig(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid stage config ID" };
    }

    const { error } = await supabase
      .from("stage_configs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting stage config:", error);
      return { success: false, error: "Failed to delete stage config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteStageConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// STAGE ACTIONS
// =============================================================================

/**
 * Create a new Stage within a config
 */
export async function createStage(
  data: {
    id: string;
    config_id: string;
    encrypted_name: string;
    color?: string | null;
    icon?: string;
    sort_order: number;
    default_rows_shown?: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = CreateStageSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid stage data:", validationResult.error.format());
      return { success: false, error: "Invalid stage data" };
    }
    const validatedData = validationResult.data;

    // Verify user owns the config
    const { data: config, error: configError } = await supabase
      .from("stage_configs")
      .select("id")
      .eq("id", validatedData.config_id)
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return { success: false, error: "Stage config not found" };
    }

    const { data: stage, error } = await supabase
      .from("stages")
      .insert({
        id: validatedData.id,
        config_id: validatedData.config_id,
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
        color: validatedData.color ?? null,
        icon: validatedData.icon ?? "circle",
        sort_order: validatedData.sort_order,
        default_rows_shown: validatedData.default_rows_shown,
      })
      .select("id")
      .single();

    if (error || !stage) {
      logger.error("Error creating stage:", error);
      return { success: false, error: "Failed to create stage" };
    }

    return { success: true, data: { id: stage.id } };
  } catch (error) {
    logger.error("Unexpected error in createStage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Stages for a config
 */
export async function getStages(
  configId: string
): Promise<ActionResponse<StageRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "stages" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    const { data: stages, error } = await supabase
      .from("stages")
      .select("*")
      .eq("config_id", configId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .returns<StageRow[]>();

    if (error) {
      logger.error("Error getting stages:", error);
      return { success: false, error: "Failed to get stages" };
    }

    return { success: true, data: stages ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getStages:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Stage
 */
export async function updateStage(
  data: {
    id: string;
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
    default_rows_shown?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = UpdateStageSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid stage data" };
    }
    const validatedData = validationResult.data;

    const updateObj: Record<string, unknown> = {};
    if (validatedData.encrypted_name !== undefined) {
      updateObj.encrypted_name = validatedData.encrypted_name;
    }
    if (validatedData.color !== undefined) {
      updateObj.color = validatedData.color;
    }
    if (validatedData.icon !== undefined) {
      updateObj.icon = validatedData.icon;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }
    if (validatedData.default_rows_shown !== undefined) {
      updateObj.default_rows_shown = validatedData.default_rows_shown;
    }

    const { error } = await supabase
      .from("stages")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating stage:", error);
      return { success: false, error: "Failed to update stage" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateStage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Stage
 */
export async function deleteStage(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid stage ID" };
    }

    const { error } = await supabase
      .from("stages")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting stage:", error);
      return { success: false, error: "Failed to delete stage" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteStage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch reorder stages within a config
 */
export async function reorderStages(
  updates: { id: string; sort_order: number }[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const validationResult = ReorderStagesSchema.safeParse(updates);
    if (!validationResult.success) {
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    // Update all stages in parallel for better performance
    const results = await Promise.all(
      validatedUpdates.map((update) =>
        supabase
          .from("stages")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id)
          .eq("user_id", user.id)
      )
    );

    const failedResult = results.find((r) => r.error);
    if (failedResult?.error) {
      logger.error("Error reordering stage:", failedResult.error);
      return { success: false, error: "Failed to reorder stages" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderStages:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// STAGE ASSIGNMENT ACTIONS
// =============================================================================

/**
 * Get the stage assignment for an entity list
 */
export async function getStageAssignment(
  entityType: EntityType,
  parentId: string | null
): Promise<ActionResponse<StageAssignment | null>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "stages" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    if (parentId !== null && !z.string().uuid().safeParse(parentId).success) {
      return { success: false, error: "Invalid parent ID" };
    }

    let query = supabase
      .from("stage_assignments")
      .select("*")
      .eq("user_id", user.id)
      .eq("entity_type", entityType);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data: assignments, error } = await query.limit(1);

    if (error) {
      logger.error("Error getting stage assignment:", error);
      return { success: false, error: "Failed to get stage assignment" };
    }

    const first = assignments?.[0];
    const assignment = first ?? null;

    return { success: true, data: assignment };
  } catch (error) {
    logger.error("Unexpected error in getStageAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Set (upsert) the stage assignment for an entity list
 */
export async function setStageAssignment(
  entityType: EntityType,
  parentId: string | null,
  configId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    if (parentId !== null && !z.string().uuid().safeParse(parentId).success) {
      return { success: false, error: "Invalid parent ID" };
    }

    // Verify user owns the config (defense-in-depth)
    const { data: config, error: configError } = await supabase
      .from("stage_configs")
      .select("id")
      .eq("id", configId)
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return { success: false, error: "Stage config not found" };
    }

    // Upsert: try to find existing assignment first
    let query = supabase
      .from("stage_assignments")
      .select("id")
      .eq("entity_type", entityType)
      .eq("user_id", user.id);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data: existing } = await query.limit(1);

    const existingFirst = existing?.[0];
    if (existingFirst) {
      // Update existing assignment
      const existingId = existingFirst.id;
      const { error } = await supabase
        .from("stage_assignments")
        .update({ config_id: configId })
        .eq("id", existingId);

      if (error) {
        logger.error("Error updating stage assignment:", error);
        return { success: false, error: "Failed to update stage assignment" };
      }

      return { success: true, data: { id: existingId } };
    } else {
      // Insert new assignment
      const { data: assignment, error } = await supabase
        .from("stage_assignments")
        .insert({
          user_id: user.id,
          config_id: configId,
          entity_type: entityType,
          parent_id: parentId,
        })
        .select("id")
        .single();

      if (error || !assignment) {
        logger.error("Error creating stage assignment:", error);
        return { success: false, error: "Failed to create stage assignment" };
      }

      return { success: true, data: { id: assignment.id } };
    }
  } catch (error) {
    logger.error("Unexpected error in setStageAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Remove the stage assignment for an entity list
 */
export async function removeStageAssignment(
  entityType: EntityType,
  parentId: string | null,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "stages",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    let query = supabase
      .from("stage_assignments")
      .delete()
      .eq("entity_type", entityType)
      .eq("user_id", user.id);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { error } = await query;

    if (error) {
      logger.error("Error removing stage assignment:", error);
      return { success: false, error: "Failed to remove stage assignment" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in removeStageAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
