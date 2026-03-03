"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ENTITY_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DEFAULT_STAGE_CONFIGS,
  DEFAULT_UNIT_STAGE_ID,
} from "@/lib/config/default-stages";
import { ATTACHMENT_BUCKET } from "@/lib/constants";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, UnitRow } from "@/lib/types";

/** Revalidate unit list route impacted by structural unit mutations. */
function revalidateUnitListRoute(): void {
  revalidatePath("/tasks");
}

/** Revalidate a unit detail route impacted by unit mutations. */
function revalidateUnitDetailRoute(unitId: string): void {
  revalidatePath(`/tasks/units/${unitId}`);
}

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for stage_id - accepts only built-in default unit stage IDs */
const ALLOWED_UNIT_STAGE_IDS = DEFAULT_STAGE_CONFIGS.unit.stages.map(
  (stage) => stage.id
) as [string, ...string[]];
const StageIdSchema = z.enum(ALLOWED_UNIT_STAGE_IDS).optional();

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
    if (!DEFAULT_UNIT_STAGE_ID) {
      logger.error("Missing default unit stage configuration");
      return { success: false, error: "Failed to create unit" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = CreateUnitSchema.safeParse({
      ...data,
      stage_id: data.stage_id ?? undefined,
    });
    if (!validationResult.success) {
      logger.warn("Invalid unit data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid unit data" };
    }
    const validatedData = validationResult.data;

    // Enforce per-user Unit limit before insert.
    const { count: unitCount, error: countError } = await supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) {
      logger.error("Error counting units:", countError);
      return { success: false, error: "Failed to create unit" };
    }
    if ((unitCount ?? 0) >= ENTITY_LIMITS.MAX_UNITS_PER_USER) {
      return {
        success: false,
        error: `Unit limit reached (max ${ENTITY_LIMITS.MAX_UNITS_PER_USER} per user)`,
      };
    }

    // Insert unit
    const { data: unit, error } = await supabase
      .from("units")
      .insert({
        id: validatedData.id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? DEFAULT_UNIT_STAGE_ID,
      })
      .select("id")
      .single();

    if (error || !unit) {
      logger.error("Error creating unit:", error);
      return { success: false, error: "Failed to create unit" };
    }

    revalidatePath("/tasks");
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
    const validationResult = UpdateUnitSchema.safeParse({
      ...data,
      stage_id: data.stage_id ?? undefined,
    });
    if (!validationResult.success) {
      logger.warn("Invalid unit update data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
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

    revalidateUnitDetailRoute(validatedData.id);
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Unit (cascades to all Spaces, Items, and Attachments).
 * Cascading deletes remove related rows in Postgres.
 * Storage cleanup for cascaded attachment files is handled separately.
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

    // Collect attachment paths under the whole unit hierarchy before delete.
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id")
      .eq("unit_id", id)
      .eq("user_id", user.id);
    if (spacesError) {
      logger.error("Error fetching unit spaces for cleanup:", spacesError);
      return { success: false, error: "Failed to delete unit" };
    }

    const spaceIds = (spaces ?? []).map((space) => space.id);
    let attachmentPaths: string[] = [];
    if (spaceIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id")
        .in("space_id", spaceIds)
        .eq("user_id", user.id);
      if (itemsError) {
        logger.error("Error fetching unit items for cleanup:", itemsError);
        return { success: false, error: "Failed to delete unit" };
      }

      const itemIds = (items ?? []).map((item) => item.id);
      if (itemIds.length > 0) {
        const { data: attachments, error: attachmentsError } = await supabase
          .from("item_attachments")
          .select("storage_path")
          .in("item_id", itemIds)
          .eq("user_id", user.id);
        if (attachmentsError) {
          logger.error(
            "Error fetching unit attachment paths for cleanup:",
            attachmentsError
          );
          return { success: false, error: "Failed to delete unit" };
        }
        attachmentPaths = (attachments ?? [])
          .map((row) => row.storage_path)
          .filter(
            (path): path is string =>
              typeof path === "string" && path.length > 0
          );
      }
    }

    // Delete unit (RLS + explicit user_id check for defense-in-depth)
    // CASCADE will delete all associated Spaces, Items, and Attachment rows.
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting unit:", error);
      return { success: false, error: "Failed to delete unit" };
    }

    if (attachmentPaths.length > 0) {
      const adminClient = createAdminClient();
      const { error: storageError } = await adminClient.storage
        .from(ATTACHMENT_BUCKET)
        .remove(attachmentPaths);
      if (storageError) {
        logger.error(
          "Error deleting cascaded unit attachment files:",
          storageError
        );
      }
    }

    revalidateUnitListRoute();
    revalidateUnitDetailRoute(id);
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteUnit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
