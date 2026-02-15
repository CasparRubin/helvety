"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, UnitRow } from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for stage_id - accepts both UUIDs (custom stages) and constrained default stage IDs */
const StageIdSchema = z
  .union([
    z.string().uuid(),
    z
      .string()
      .regex(/^default-[a-z0-9-]+$/)
      .max(50),
  ])
  .nullable()
  .optional();

/** Schema for creating a Unit */
const CreateUnitSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating a Unit */
const UpdateUnitSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

// =============================================================================
// UNIT ACTIONS
// =============================================================================

/**
 * Create a new Unit
 * Receives pre-encrypted data from the client
 */
export async function createUnit(
  data: {
    id: string;
    encrypted_title: string;
    encrypted_description: string | null;
    stage_id?: string | null;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = CreateUnitSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid unit data:", validationResult.error.format());
      return { success: false, error: "Invalid unit data" };
    }
    const validatedData = validationResult.data;

    // Insert unit
    const { data: unit, error } = await supabase
      .from("units")
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? null,
      })
      .select("id")
      .single();

    if (error || !unit) {
      logger.error("Error creating unit:", error);
      return { success: false, error: "Failed to create unit" };
    }

    return { success: true, data: { id: unit.id } };
  } catch (error) {
    logger.error("Unexpected error in createUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Units for the current user
 * Returns encrypted data that must be decrypted client-side
 */
export async function getUnits(): Promise<ActionResponse<UnitRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get units (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: units, error } = await supabase
      .from("units")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<UnitRow[]>();

    if (error) {
      logger.error("Error getting units:", error);
      return { success: false, error: "Failed to get units" };
    }

    return { success: true, data: units ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getUnits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Unit by ID
 */
export async function getUnit(id: string): Promise<ActionResponse<UnitRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get unit (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: unit, error } = await supabase
      .from("units")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .returns<UnitRow[]>()
      .single();

    if (error || !unit) {
      if (error?.code === "PGRST116" || !unit) {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error getting unit:", error);
      return { success: false, error: "Failed to get unit" };
    }

    return { success: true, data: unit };
  } catch (error) {
    logger.error("Unexpected error in getUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Unit
 */
export async function updateUnit(
  data: {
    id: string;
    encrypted_title?: string;
    encrypted_description?: string | null;
    stage_id?: string | null;
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
    const validationResult = UpdateUnitSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid unit update data:", validationResult.error.format());
      return { success: false, error: "Invalid unit data" };
    }
    const validatedData = validationResult.data;

    // Build update object (only include provided fields)
    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validatedData.encrypted_title !== undefined) {
      updateObj.encrypted_title = validatedData.encrypted_title;
    }
    if (validatedData.encrypted_description !== undefined) {
      updateObj.encrypted_description = validatedData.encrypted_description;
    }
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update unit (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("units")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating unit:", error);
      return { success: false, error: "Failed to update unit" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Unit (cascades to all Spaces, Items, and Attachments).
 * Encrypted attachment files are automatically removed from storage
 * by the `on_attachment_deleted` database trigger.
 */
export async function deleteUnit(
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
      return { success: false, error: "Invalid unit ID" };
    }

    // Delete unit (RLS + explicit user_id check for defense-in-depth)
    // CASCADE will delete all associated Spaces, Items, and Attachments
    // The on_attachment_deleted trigger handles storage file cleanup
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting unit:", error);
      return { success: false, error: "Failed to delete unit" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
