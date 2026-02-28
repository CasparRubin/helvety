"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import type { ActionResponse, UnitRow, SpaceRow, ItemRow } from "@/lib/types";

const MAX_DASHBOARD_ROWS = 2000;
const MAX_COUNT_ROWS = 10000;

// =============================================================================
// Batch Response Types
// =============================================================================

/** Data returned by the Units dashboard batch fetch */
export interface UnitsDashboardData {
  units: UnitRow[];
  spaceCounts: Record<string, number>;
}

/** Data returned by the Spaces dashboard batch fetch */
export interface SpacesDashboardData {
  unit: UnitRow;
  spaces: SpaceRow[];
  itemCounts: Record<string, number>;
}

/** Data returned by the Items dashboard batch fetch */
export interface ItemsDashboardData {
  unit: UnitRow;
  space: SpaceRow;
  items: ItemRow[];
}

/** Data returned by the Item editor batch fetch. */
export interface ItemEditorData {
  unit: UnitRow;
  space: SpaceRow;
  item: ItemRow;
}

// =============================================================================
// BATCH READ ACTIONS
// =============================================================================

/**
 * Batch fetch all data needed for the Units (top-level) dashboard.
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 2 separate server actions on initial load:
 *   getUnits, getSpaceCounts
 */
export async function getUnitsDashboardData(): Promise<
  ActionResponse<UnitsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [unitsResult, spacesResult] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(MAX_DASHBOARD_ROWS + 1)
        .returns<UnitRow[]>(),
      supabase
        .from("spaces")
        .select("unit_id")
        .eq("user_id", user.id)
        .limit(MAX_COUNT_ROWS + 1),
    ]);

    if (unitsResult.error || spacesResult.error) {
      logger.error("Error in getUnitsDashboardData:", {
        units: unitsResult.error,
        spaces: spacesResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    if ((unitsResult.data?.length ?? 0) > MAX_DASHBOARD_ROWS) {
      return {
        success: false,
        error: "Too many units to load in one request",
      };
    }
    if ((spacesResult.data?.length ?? 0) > MAX_COUNT_ROWS) {
      return {
        success: false,
        error: "Too many spaces to aggregate in one request",
      };
    }

    // Aggregate space counts by unit_id
    const spaceCounts: Record<string, number> = {};
    for (const space of spacesResult.data ?? []) {
      spaceCounts[space.unit_id] = (spaceCounts[space.unit_id] ?? 0) + 1;
    }

    return {
      success: true,
      data: {
        units: unitsResult.data ?? [],
        spaceCounts,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getUnitsDashboardData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch fetch all data needed for the Spaces dashboard (within a Unit).
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 3 separate server actions on initial load:
 *   getUnit, getSpaces, getItemCounts
 */
export async function getSpacesDashboardData(
  unitId: string
): Promise<ActionResponse<SpacesDashboardData>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [unitResult, spacesResult] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .eq("user_id", user.id)
        .returns<UnitRow[]>()
        .single(),
      supabase
        .from("spaces")
        .select("*")
        .eq("unit_id", unitId)
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(MAX_DASHBOARD_ROWS + 1)
        .returns<SpaceRow[]>(),
    ]);

    if (unitResult.error || !unitResult.data) {
      const err = unitResult.error;
      if (err?.code === "PGRST116" || !unitResult.data) {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error fetching unit in batch:", err);
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (spacesResult.error) {
      logger.error("Error in getSpacesDashboardData:", {
        spaces: spacesResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    if ((spacesResult.data?.length ?? 0) > MAX_DASHBOARD_ROWS) {
      return {
        success: false,
        error: "Too many spaces to load in one request",
      };
    }

    // Get item counts for the spaces in this unit
    const spaceIds = (spacesResult.data ?? []).map((s) => s.id);
    const itemCounts: Record<string, number> = {};

    if (spaceIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("space_id")
        .in("space_id", spaceIds)
        .eq("user_id", user.id)
        .limit(MAX_COUNT_ROWS + 1);

      if (itemsError) {
        logger.error("Error getting item counts in batch:", itemsError);
        // Non-fatal: proceed with empty counts
      } else {
        if ((items?.length ?? 0) > MAX_COUNT_ROWS) {
          return {
            success: false,
            error: "Too many items to aggregate in one request",
          };
        }
        for (const item of items ?? []) {
          itemCounts[item.space_id] = (itemCounts[item.space_id] ?? 0) + 1;
        }
      }
    }

    return {
      success: true,
      data: {
        unit: unitResult.data,
        spaces: spacesResult.data ?? [],
        itemCounts,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getSpacesDashboardData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch fetch all data needed for the Items dashboard (within a Space).
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 3 separate server actions on initial load:
 *   getUnit, getSpace, getItems
 */
export async function getItemsDashboardData(
  unitId: string,
  spaceId: string
): Promise<ActionResponse<ItemsDashboardData>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }
    if (!z.string().uuid().safeParse(spaceId).success) {
      return { success: false, error: "Invalid space ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [unitResult, spaceResult, itemsResult] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .eq("user_id", user.id)
        .returns<UnitRow[]>()
        .single(),
      supabase
        .from("spaces")
        .select("*")
        .eq("id", spaceId)
        .eq("user_id", user.id)
        .returns<SpaceRow[]>()
        .single(),
      supabase
        .from("items")
        .select("*")
        .eq("space_id", spaceId)
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(MAX_DASHBOARD_ROWS + 1)
        .returns<ItemRow[]>(),
    ]);

    if (unitResult.error || !unitResult.data) {
      const err = unitResult.error;
      if (err?.code === "PGRST116" || !unitResult.data) {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error fetching unit in batch:", err);
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (spaceResult.error || !spaceResult.data) {
      const err = spaceResult.error;
      if (err?.code === "PGRST116" || !spaceResult.data) {
        return { success: false, error: "Space not found" };
      }
      logger.error("Error fetching space in batch:", err);
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (itemsResult.error) {
      logger.error("Error in getItemsDashboardData:", {
        items: itemsResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    if ((itemsResult.data?.length ?? 0) > MAX_DASHBOARD_ROWS) {
      return {
        success: false,
        error: "Too many items to load in one request",
      };
    }

    return {
      success: true,
      data: {
        unit: unitResult.data,
        space: spaceResult.data,
        items: itemsResult.data ?? [],
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getItemsDashboardData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Batch fetch all data needed for the Item editor route.
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 3 separate server actions on initial load:
 *   getUnit, getSpace, getItem
 */
export async function getItemEditorData(
  unitId: string,
  spaceId: string,
  itemId: string
): Promise<ActionResponse<ItemEditorData>> {
  try {
    if (!z.string().uuid().safeParse(unitId).success) {
      return { success: false, error: "Invalid unit ID" };
    }
    if (!z.string().uuid().safeParse(spaceId).success) {
      return { success: false, error: "Invalid space ID" };
    }
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [unitResult, spaceResult, itemResult] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .eq("user_id", user.id)
        .returns<UnitRow[]>()
        .single(),
      supabase
        .from("spaces")
        .select("*")
        .eq("id", spaceId)
        .eq("unit_id", unitId)
        .eq("user_id", user.id)
        .returns<SpaceRow[]>()
        .single(),
      supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .eq("space_id", spaceId)
        .eq("user_id", user.id)
        .returns<ItemRow[]>()
        .single(),
    ]);

    if (unitResult.error || !unitResult.data) {
      const err = unitResult.error;
      if (err?.code === "PGRST116" || !unitResult.data) {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error fetching unit in item editor batch:", err);
      return { success: false, error: "Failed to load item editor data" };
    }

    if (spaceResult.error || !spaceResult.data) {
      const err = spaceResult.error;
      if (err?.code === "PGRST116" || !spaceResult.data) {
        return { success: false, error: "Space not found" };
      }
      logger.error("Error fetching space in item editor batch:", err);
      return { success: false, error: "Failed to load item editor data" };
    }

    if (itemResult.error || !itemResult.data) {
      const err = itemResult.error;
      if (err?.code === "PGRST116" || !itemResult.data) {
        return { success: false, error: "Item not found" };
      }
      logger.error("Error fetching item in item editor batch:", err);
      return { success: false, error: "Failed to load item editor data" };
    }

    return {
      success: true,
      data: {
        unit: unitResult.data,
        space: spaceResult.data,
        item: itemResult.data,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getItemEditorData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
