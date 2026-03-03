"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ENTITY_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  DEFAULT_SPACE_STAGE_ID,
  DEFAULT_STAGE_CONFIGS,
} from "@/lib/config/default-stages";
import { ATTACHMENT_BUCKET } from "@/lib/constants";
import { EncryptedDataSchema } from "@/lib/validation-schemas";

import type { ActionResponse, SpaceRow } from "@/lib/types";

/** Revalidate space list/detail routes impacted by space mutations. */
function revalidateSpaceRoutes(unitId: string, spaceId?: string): void {
  revalidatePath(`/tasks/units/${unitId}`);
  if (spaceId) {
    revalidatePath(`/tasks/units/${unitId}/spaces/${spaceId}`);
  }
}

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for stage_id - accepts only built-in default space stage IDs */
const ALLOWED_SPACE_STAGE_IDS = DEFAULT_STAGE_CONFIGS.space.stages.map(
  (stage) => stage.id
) as [string, ...string[]];
const StageIdSchema = z.enum(ALLOWED_SPACE_STAGE_IDS).nullable().optional();

/** Schema for creating a Space */
const CreateSpaceSchema = z.object({
  id: z.string().uuid(),
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
    id: string;
    unit_id: string;
    encrypted_title: string;
    encrypted_description: string | null;
    stage_id?: string | null;
  },
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!DEFAULT_SPACE_STAGE_ID) {
      logger.error("Missing default space stage configuration");
      return { success: false, error: "Failed to create space" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input
    const validationResult = CreateSpaceSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn("Invalid space data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid space data" };
    }
    const validatedData = validationResult.data;

    // Verify user owns the unit (RLS will also check this on insert)
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("id")
      .eq("id", validatedData.unit_id)
      .eq("user_id", user.id)
      .single();

    if (unitError || !unit) {
      return { success: false, error: "Unit not found" };
    }

    // Enforce per-unit Space limit before insert.
    const { count: spaceCount, error: countError } = await supabase
      .from("spaces")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("unit_id", validatedData.unit_id);
    if (countError) {
      logger.error("Error counting spaces for unit:", countError);
      return { success: false, error: "Failed to create space" };
    }
    if ((spaceCount ?? 0) >= ENTITY_LIMITS.MAX_SPACES_PER_UNIT) {
      return {
        success: false,
        error: `Space limit reached (max ${ENTITY_LIMITS.MAX_SPACES_PER_UNIT} per unit)`,
      };
    }

    // Insert space
    const { data: space, error } = await supabase
      .from("spaces")
      .insert({
        id: validatedData.id,
        unit_id: validatedData.unit_id,
        user_id: user.id,
        encrypted_title: validatedData.encrypted_title,
        encrypted_description: validatedData.encrypted_description,
        stage_id: validatedData.stage_id ?? DEFAULT_SPACE_STAGE_ID,
      })
      .select("id")
      .single();

    if (error || !space) {
      logger.error("Error creating space:", error);
      return { success: false, error: "Failed to create space" };
    }

    revalidateSpaceRoutes(validatedData.unit_id, space.id);
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
      logger.warn("Invalid space update data", {
        fields: validationResult.error.issues.map((issue) =>
          issue.path.join(".")
        ),
        issueCount: validationResult.error.issues.length,
      });
      return { success: false, error: "Invalid space data" };
    }
    const validatedData = validationResult.data;
    const { data: spaceScope, error: spaceScopeError } = await supabase
      .from("spaces")
      .select("unit_id")
      .eq("id", validatedData.id)
      .eq("user_id", user.id)
      .maybeSingle<{ unit_id: string }>();
    if (spaceScopeError) {
      logger.error(
        "Error reading space scope for revalidation:",
        spaceScopeError
      );
      return { success: false, error: "Failed to update space" };
    }
    if (!spaceScope?.unit_id) {
      return { success: false, error: "Space not found" };
    }

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

    revalidateSpaceRoutes(spaceScope.unit_id, validatedData.id);
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in updateSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a Space (cascades to all Items and their Attachments).
 * Cascading deletes remove related item and attachment rows in Postgres.
 * Storage cleanup for cascaded attachment files is handled separately.
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

    const { data: spaceScope, error: spaceScopeError } = await supabase
      .from("spaces")
      .select("unit_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle<{ unit_id: string }>();
    if (spaceScopeError) {
      logger.error("Error reading space scope for delete revalidation:", {
        id,
        error: spaceScopeError,
      });
      return { success: false, error: "Failed to delete space" };
    }
    if (!spaceScope?.unit_id) {
      return { success: false, error: "Space not found" };
    }

    // Collect storage paths for attachments under this space before delete.
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id")
      .eq("space_id", id)
      .eq("user_id", user.id);
    if (itemsError) {
      logger.error("Error fetching space items for cleanup:", itemsError);
      return { success: false, error: "Failed to delete space" };
    }

    const itemIds = (items ?? []).map((item) => item.id);
    let attachmentPaths: string[] = [];
    if (itemIds.length > 0) {
      const { data: attachments, error: attachmentsError } = await supabase
        .from("item_attachments")
        .select("storage_path")
        .in("item_id", itemIds)
        .eq("user_id", user.id);
      if (attachmentsError) {
        logger.error(
          "Error fetching space attachment paths for cleanup:",
          attachmentsError
        );
        return { success: false, error: "Failed to delete space" };
      }
      attachmentPaths = (attachments ?? [])
        .map((row) => row.storage_path)
        .filter(
          (path): path is string => typeof path === "string" && path.length > 0
        );
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

    if (attachmentPaths.length > 0) {
      const adminClient = createAdminClient();
      const { error: storageError } = await adminClient.storage
        .from(ATTACHMENT_BUCKET)
        .remove(attachmentPaths);
      if (storageError) {
        logger.error(
          "Error deleting cascaded space attachment files:",
          storageError
        );
      }
    }

    revalidateSpaceRoutes(spaceScope.unit_id, id);
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in deleteSpace:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
