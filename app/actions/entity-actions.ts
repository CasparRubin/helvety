"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UnitRow,
  SpaceRow,
  ItemRow,
  EntityType,
  ReorderUpdate,
  EncryptedTaskExport,
} from "@/lib/types";

// =============================================================================
// Input Validation Schemas
// =============================================================================

/** Schema for batch reorder updates (capped to prevent DoS via unbounded parallel queries) */
const ReorderSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
      // Accept both UUIDs (custom stages) and constrained default stage IDs
      stage_id: z
        .union([
          z.string().uuid(),
          z
            .string()
            .regex(/^default-[a-z0-9-]+$/)
            .max(50),
        ])
        .nullable()
        .optional(),
    })
  )
  .max(500, "Too many items to reorder");

const EntityTypeSchema = z.enum(["unit", "space", "item"]);

// =============================================================================
// BATCH REORDER ACTION (for drag-and-drop)
// =============================================================================

/**
 * Batch update sort_order (and optionally stage_id) for multiple entities
 * Used during drag-and-drop reordering
 */
export async function reorderEntities(
  entityType: EntityType,
  updates: ReorderUpdate[],
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "tasks",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const typeResult = EntityTypeSchema.safeParse(entityType);
    if (!typeResult.success) {
      return { success: false, error: "Invalid entity type" };
    }

    const validationResult = ReorderSchema.safeParse(updates);
    if (!validationResult.success) {
      logger.warn("Invalid reorder data:", validationResult.error.format());
      return { success: false, error: "Invalid reorder data" };
    }
    const validatedUpdates = validationResult.data;

    if (validatedUpdates.length === 0) {
      return { success: true };
    }

    const tableName =
      entityType === "unit"
        ? "units"
        : entityType === "space"
          ? "spaces"
          : "items";

    // Batch update all entities in parallel for better performance
    const now = new Date().toISOString();
    const results = await Promise.all(
      validatedUpdates.map((update) => {
        const updateObj: Record<string, unknown> = {
          sort_order: update.sort_order,
          updated_at: now,
        };
        if (update.stage_id !== undefined) {
          updateObj.stage_id = update.stage_id;
        }

        return supabase
          .from(tableName)
          .update(updateObj)
          .eq("id", update.id)
          .eq("user_id", user.id);
      })
    );

    const failedResult = results.find((r) => r.error);
    if (failedResult?.error) {
      logger.error(`Error reordering ${entityType}:`, failedResult.error);
      return { success: false, error: `Failed to reorder ${entityType}s` };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in reorderEntities:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// CHILD COUNT ACTIONS (for displaying counts in entity lists)
// =============================================================================

/**
 * Get the number of spaces per unit for the current user.
 * Returns a map of unit_id -> space count.
 */
export async function getSpaceCounts(): Promise<
  ActionResponse<Record<string, number>>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get all spaces for this user, selecting only the unit_id
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("unit_id")
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error getting space counts:", error);
      return { success: false, error: "Failed to get space counts" };
    }

    // Aggregate counts by unit_id
    const counts: Record<string, number> = {};
    for (const space of spaces ?? []) {
      counts[space.unit_id] = (counts[space.unit_id] ?? 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    logger.error("Unexpected error in getSpaceCounts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get the number of items per space for a given unit.
 * Returns a map of space_id -> item count.
 */
export async function getItemCounts(
  unitId: string
): Promise<ActionResponse<Record<string, number>>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // First get the space IDs for this unit
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id")
      .eq("unit_id", unitId)
      .eq("user_id", user.id);

    if (spacesError) {
      logger.error("Error getting spaces for item counts:", spacesError);
      return { success: false, error: "Failed to get item counts" };
    }

    const spaceIds = (spaces ?? []).map((s) => s.id);
    if (spaceIds.length === 0) {
      return { success: true, data: {} };
    }

    // Get all items for these spaces, selecting only the space_id
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("space_id")
      .in("space_id", spaceIds)
      .eq("user_id", user.id);

    if (itemsError) {
      logger.error("Error getting item counts:", itemsError);
      return { success: false, error: "Failed to get item counts" };
    }

    // Aggregate counts by space_id
    const counts: Record<string, number> = {};
    for (const item of items ?? []) {
      counts[item.space_id] = (counts[item.space_id] ?? 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    logger.error("Unexpected error in getItemCounts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// DATA EXPORT (nDSG Art. 28, Right to Data Portability)
// =============================================================================

export type { EncryptedTaskExport } from "@/lib/types";

/**
 * Fetch all encrypted task data for export.
 * Returns all units, spaces, and items as encrypted rows.
 * The client is responsible for decrypting the data using the user's
 * encryption key before presenting or saving the export.
 *
 * Legal basis: nDSG Art. 28 (right to data portability)
 */
export async function getAllTaskDataForExport(): Promise<
  ActionResponse<EncryptedTaskExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      rateLimitConfig: { maxRequests: 5, windowMs: RATE_LIMITS.API.windowMs },
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Fetch all user data (explicit user_id filter as defense-in-depth alongside RLS)
    const [unitsResult, spacesResult, itemsResult] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order")
        .returns<UnitRow[]>(),
      supabase
        .from("spaces")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order")
        .returns<SpaceRow[]>(),
      supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order")
        .returns<ItemRow[]>(),
    ]);

    if (unitsResult.error || spacesResult.error || itemsResult.error) {
      logger.error("Error fetching task data for export:", {
        units: unitsResult.error,
        spaces: spacesResult.error,
        items: itemsResult.error,
      });
      return { success: false, error: "Failed to fetch task data" };
    }

    logger.info(`Data export requested for user ${user.id}`);

    return {
      success: true,
      data: {
        units: unitsResult.data ?? [],
        spaces: spacesResult.data ?? [],
        items: itemsResult.data ?? [],
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getAllTaskDataForExport:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
