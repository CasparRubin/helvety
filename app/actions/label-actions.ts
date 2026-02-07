"use server";

import "server-only";

import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import type {
  ActionResponse,
  LabelConfigRow,
  LabelRow,
  LabelAssignment,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

const EncryptedDataSchema = z
  .string()
  .min(1)
  .max(100000)
  .refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed.iv === "string" &&
          typeof parsed.ciphertext === "string" &&
          typeof parsed.version === "number"
        );
      } catch {
        return false;
      }
    },
    { message: "Invalid encrypted data format" }
  );

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

const CreateLabelConfigSchema = z.object({
  encrypted_name: EncryptedDataSchema,
});

const UpdateLabelConfigSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
});

const CreateLabelSchema = z.object({
  config_id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema,
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).default(0),
});

const UpdateLabelSchema = z.object({
  id: z.string().uuid(),
  encrypted_name: EncryptedDataSchema.optional(),
  color: HexColorSchema,
  icon: IconNameSchema,
  sort_order: z.number().int().min(0).optional(),
});

const ReorderLabelsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  })
);

// =============================================================================
// LABEL CONFIG ACTIONS
// =============================================================================

/**
 * Create a new LabelConfig
 */
export async function createLabelConfig(
  data: { encrypted_name: string },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const validationResult = CreateLabelConfigSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid label config data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid label config data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: config, error } = await supabase
      .from("label_configs")
      .insert({
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Error creating label config:", error);
      return { success: false, error: "Failed to create label config" };
    }

    return { success: true, data: { id: config.id } };
  } catch (error) {
    logger.error("Unexpected error in createLabelConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all LabelConfigs for the current user
 */
export async function getLabelConfigs(): Promise<
  ActionResponse<LabelConfigRow[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: configs, error } = await supabase
      .from("label_configs")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error getting label configs:", error);
      return { success: false, error: "Failed to get label configs" };
    }

    return { success: true, data: configs as LabelConfigRow[] };
  } catch (error) {
    logger.error("Unexpected error in getLabelConfigs:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a LabelConfig
 */
export async function updateLabelConfig(
  data: { id: string; encrypted_name?: string },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const validationResult = UpdateLabelConfigSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid label config data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_name !== undefined) {
      updateObj.encrypted_name = validatedData.encrypted_name;
    }

    const { error } = await supabase
      .from("label_configs")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating label config:", error);
      return { success: false, error: "Failed to update label config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateLabelConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a LabelConfig (cascades to labels and assignments)
 */
export async function deleteLabelConfig(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid label config ID" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("label_configs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting label config:", error);
      return { success: false, error: "Failed to delete label config" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteLabelConfig:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// LABEL ACTIONS
// =============================================================================

/**
 * Create a new Label within a config
 */
export async function createLabel(
  data: {
    config_id: string;
    encrypted_name: string;
    color?: string | null;
    icon?: string;
    sort_order: number;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const validationResult = CreateLabelSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid label data:", validationResult.error.format());
      return { success: false, error: "Invalid label data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns the config
    const { data: config, error: configError } = await supabase
      .from("label_configs")
      .select("id")
      .eq("id", validatedData.config_id)
      .single();

    if (configError || !config) {
      return { success: false, error: "Label config not found" };
    }

    const { data: label, error } = await supabase
      .from("labels")
      .insert({
        config_id: validatedData.config_id,
        user_id: user.id,
        encrypted_name: validatedData.encrypted_name,
        color: validatedData.color ?? null,
        icon: validatedData.icon ?? "circle",
        sort_order: validatedData.sort_order,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Error creating label:", error);
      return { success: false, error: "Failed to create label" };
    }

    return { success: true, data: { id: label.id } };
  } catch (error) {
    logger.error("Unexpected error in createLabel:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Labels for a config
 */
export async function getLabels(
  configId: string
): Promise<ActionResponse<LabelRow[]>> {
  try {
    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: labels, error } = await supabase
      .from("labels")
      .select("*")
      .eq("config_id", configId)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Error getting labels:", error);
      return { success: false, error: "Failed to get labels" };
    }

    return { success: true, data: labels as LabelRow[] };
  } catch (error) {
    logger.error("Unexpected error in getLabels:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Label
 */
export async function updateLabel(
  data: {
    id: string;
    encrypted_name?: string;
    color?: string | null;
    icon?: string;
    sort_order?: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const validationResult = UpdateLabelSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: "Invalid label data" };
    }
    const validatedData = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

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

    const { error } = await supabase
      .from("labels")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating label:", error);
      return { success: false, error: "Failed to update label" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateLabel:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Label
 */
export async function deleteLabel(
  id: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid label ID" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("labels")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting label:", error);
      return { success: false, error: "Failed to delete label" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteLabel:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch reorder labels within a config
 */
export async function reorderLabels(
  updates: { id: string; sort_order: number }[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const validationResult = ReorderLabelsSchema.safeParse(updates);
    if (!validationResult.success) {
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update each label's sort_order (explicit user_id check for defense-in-depth)
    for (const update of validatedUpdates) {
      const { error } = await supabase
        .from("labels")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id)
        .eq("user_id", user.id);

      if (error) {
        logger.error("Error reordering label:", error);
        return { success: false, error: "Failed to reorder labels" };
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderLabels:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// LABEL ASSIGNMENT ACTIONS
// =============================================================================

/**
 * Get the label assignment for a space's items
 */
export async function getLabelAssignment(
  parentId: string | null
): Promise<ActionResponse<LabelAssignment | null>> {
  try {
    if (parentId !== null && !z.string().uuid().safeParse(parentId).success) {
      return { success: false, error: "Invalid parent ID" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    let query = supabase.from("label_assignments").select("*");

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data: assignments, error } = await query.limit(1);

    if (error) {
      logger.error("Error getting label assignment:", error);
      return { success: false, error: "Failed to get label assignment" };
    }

    const assignment =
      assignments && assignments.length > 0
        ? (assignments[0] as LabelAssignment)
        : null;

    return { success: true, data: assignment };
  } catch (error) {
    logger.error("Unexpected error in getLabelAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Set (upsert) the label assignment for a space's items
 */
export async function setLabelAssignment(
  parentId: string | null,
  configId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    if (!z.string().uuid().safeParse(configId).success) {
      return { success: false, error: "Invalid config ID" };
    }

    if (parentId !== null && !z.string().uuid().safeParse(parentId).success) {
      return { success: false, error: "Invalid parent ID" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Upsert: try to find existing assignment first
    let query = supabase
      .from("label_assignments")
      .select("id")
      .eq("user_id", user.id);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0 && existing[0]) {
      // Update existing assignment
      const existingId = existing[0].id as string;
      const { error } = await supabase
        .from("label_assignments")
        .update({ config_id: configId })
        .eq("id", existingId);

      if (error) {
        logger.error("Error updating label assignment:", error);
        return { success: false, error: "Failed to update label assignment" };
      }

      return { success: true, data: { id: existingId } };
    } else {
      // Insert new assignment
      const { data: assignment, error } = await supabase
        .from("label_assignments")
        .insert({
          user_id: user.id,
          config_id: configId,
          parent_id: parentId,
        })
        .select("id")
        .single();

      if (error) {
        logger.error("Error creating label assignment:", error);
        return { success: false, error: "Failed to create label assignment" };
      }

      return { success: true, data: { id: assignment.id } };
    }
  } catch (error) {
    logger.error("Unexpected error in setLabelAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Remove the label assignment for a space's items
 */
export async function removeLabelAssignment(
  parentId: string | null,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    let query = supabase
      .from("label_assignments")
      .delete()
      .eq("user_id", user.id);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { error } = await query;

    if (error) {
      logger.error("Error removing label assignment:", error);
      return { success: false, error: "Failed to remove label assignment" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in removeLabelAssignment:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
