"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, SpaceRow } from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for stage_id - accepts both UUIDs (custom stages) and default stage IDs */
const StageIdSchema = z
  .union([z.string().uuid(), z.string().startsWith("default-")])
  .nullable()
  .optional();

/** Schema for creating a Space */
const CreateSpaceSchema = z.object({
  unit_id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema,
  encrypted_description: EncryptedDataSchema.nullable(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

/** Schema for updating a Space */
const UpdateSpaceSchema = z.object({
  id: z.string().uuid(),
  encrypted_title: EncryptedDataSchema.optional(),
  encrypted_description: EncryptedDataSchema.nullable().optional(),
  stage_id: StageIdSchema,
  sort_order: z.number().int().min(0).optional(),
});

// =============================================================================
// SPACE ACTIONS
// =============================================================================

/**
 * Create a new Space
 */
export async function createSpace(
  data: {
    unit_id: string;
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
    const validationResult = CreateSpaceSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid space data:", validationResult.error.format());
      return { success: false, error: "Invalid space data" };
    }
    const validatedData = validationResult.data;

    // Verify user owns the unit (RLS will also check this on insert)
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id")
      .eq("id", validatedData.unit_id)
      .single();

    if (unitError || !unit) {
      return { success: false, error: "Unit not found" };
    }

    // Insert space
    const { data: space, error } = await supabase
      .from("spaces")
      .insert({
        unit_id: validatedData.unit_id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? null,
      })
      .select("id")
      .single();

    if (error || !space) {
      logger.error("Error creating space:", error);
      return { success: false, error: "Failed to create space" };
    }

    return { success: true, data: { id: space.id } };
  } catch (error) {
    logger.error("Unexpected error in createSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all Spaces for a Unit
 */
export async function getSpaces(
  unitId: string
): Promise<ActionResponse<SpaceRow[]>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get spaces (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("unit_id", unitId)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<SpaceRow[]>();

    if (error) {
      logger.error("Error getting spaces:", error);
      return { success: false, error: "Failed to get spaces" };
    }

    return { success: true, data: spaces ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getSpaces:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single Space by ID
 */
export async function getSpace(id: string): Promise<ActionResponse<SpaceRow>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get space (explicit user_id filter as defense-in-depth alongside RLS)
    const { data: space, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .returns<SpaceRow[]>()
      .single();

    if (error || !space) {
      if (error?.code === "PGRST116" || !space) {
        return { success: false, error: "Space not found" };
      }
      logger.error("Error getting space:", error);
      return { success: false, error: "Failed to get space" };
    }

    return { success: true, data: space };
  } catch (error) {
    logger.error("Unexpected error in getSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a Space
 */
export async function updateSpace(
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
    const validationResult = UpdateSpaceSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        "Invalid space update data:",
        validationResult.error.format()
      );
      return { success: false, error: "Invalid space data" };
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
    if (validatedData.stage_id !== undefined) {
      updateObj.stage_id = validatedData.stage_id;
    }
    if (validatedData.sort_order !== undefined) {
      updateObj.sort_order = validatedData.sort_order;
    }

    // Update space (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("spaces")
      .update(updateObj)
      .eq("id", validatedData.id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error updating space:", error);
      return { success: false, error: "Failed to update space" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Space (cascades to all Items and their Attachments).
 * Encrypted attachment files are automatically removed from storage
 * by the `on_attachment_deleted` database trigger.
 */
export async function deleteSpace(
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
      return { success: false, error: "Invalid space ID" };
    }

    // Delete space (RLS + explicit user_id check for defense-in-depth)
    const { error } = await supabase
      .from("spaces")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting space:", error);
      return { success: false, error: "Failed to delete space" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
