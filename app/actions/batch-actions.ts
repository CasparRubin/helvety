"use server";

import "server-only";

import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { logger } from "@/lib/logger";

import type {
  ActionResponse,
  UnitRow,
  SpaceRow,
  ItemRow,
  StageConfigRow,
  LabelConfigRow,
  StageAssignment,
  LabelAssignment,
} from "@/lib/types";

// =============================================================================
// Batch Response Types
// =============================================================================

/** Data returned by the Units dashboard batch fetch */
export interface UnitsDashboardData {
  units: UnitRow[];
  spaceCounts: Record<string, number>;
  stageConfigs: StageConfigRow[];
  stageAssignment: StageAssignment | null;
}

/** Data returned by the Spaces dashboard batch fetch */
export interface SpacesDashboardData {
  unit: UnitRow;
  spaces: SpaceRow[];
  itemCounts: Record<string, number>;
  stageConfigs: StageConfigRow[];
  stageAssignment: StageAssignment | null;
}

/** Data returned by the Items dashboard batch fetch */
export interface ItemsDashboardData {
  unit: UnitRow;
  space: SpaceRow;
  items: ItemRow[];
  stageConfigs: StageConfigRow[];
  stageAssignment: StageAssignment | null;
  labelConfigs: LabelConfigRow[];
  labelAssignment: LabelAssignment | null;
}

// =============================================================================
// BATCH READ ACTIONS
// =============================================================================

/**
 * Batch fetch all data needed for the Units (top-level) dashboard.
 * Performs a single auth + rate-limit check, then runs all DB queries in parallel.
 *
 * Replaces 4 separate server actions on initial load:
 *   getUnits, getSpaceCounts, getStageConfigs, getStageAssignment("unit", null)
 */
export async function getUnitsDashboardData(): Promise<
  ActionResponse<UnitsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { supabase } = auth.ctx;

    const [unitsResult, spacesResult, stageConfigsResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("units")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .returns<UnitRow[]>(),
        supabase.from("spaces").select("unit_id"),
        supabase
          .from("stage_configs")
          .select("*")
          .order("created_at", { ascending: true })
          .returns<StageConfigRow[]>(),
        supabase
          .from("stage_assignments")
          .select("*")
          .eq("entity_type", "unit")
          .is("parent_id", null)
          .limit(1),
      ]);

    if (
      unitsResult.error ||
      spacesResult.error ||
      stageConfigsResult.error ||
      assignmentResult.error
    ) {
      logger.error("Error in getUnitsDashboardData:", {
        units: unitsResult.error,
        spaces: spacesResult.error,
        stageConfigs: stageConfigsResult.error,
        stageAssignment: assignmentResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
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
        stageConfigs: stageConfigsResult.data ?? [],
        stageAssignment: (assignmentResult.data?.[0] as StageAssignment) ?? null,
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
 * Replaces 5 separate server actions on initial load:
 *   getUnit, getSpaces, getItemCounts, getStageConfigs, getStageAssignment("space", unitId)
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
    const { supabase } = auth.ctx;

    const [unitResult, spacesResult, stageConfigsResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("units")
          .select("*")
          .eq("id", unitId)
          .returns<UnitRow[]>()
          .single(),
        supabase
          .from("spaces")
          .select("*")
          .eq("unit_id", unitId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .returns<SpaceRow[]>(),
        supabase
          .from("stage_configs")
          .select("*")
          .order("created_at", { ascending: true })
          .returns<StageConfigRow[]>(),
        supabase
          .from("stage_assignments")
          .select("*")
          .eq("entity_type", "space")
          .eq("parent_id", unitId)
          .limit(1),
      ]);

    if (unitResult.error || !unitResult.data) {
      const err = unitResult.error;
      if (err?.code === "PGRST116" || !unitResult.data) {
        return { success: false, error: "Unit not found" };
      }
      logger.error("Error fetching unit in batch:", err);
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (spacesResult.error || stageConfigsResult.error || assignmentResult.error) {
      logger.error("Error in getSpacesDashboardData:", {
        spaces: spacesResult.error,
        stageConfigs: stageConfigsResult.error,
        stageAssignment: assignmentResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    // Get item counts for the spaces in this unit
    const spaceIds = (spacesResult.data ?? []).map((s) => s.id);
    let itemCounts: Record<string, number> = {};

    if (spaceIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("space_id")
        .in("space_id", spaceIds);

      if (itemsError) {
        logger.error("Error getting item counts in batch:", itemsError);
        // Non-fatal: proceed with empty counts
      } else {
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
        stageConfigs: stageConfigsResult.data ?? [],
        stageAssignment: (assignmentResult.data?.[0] as StageAssignment) ?? null,
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
 * Replaces 7 separate server actions on initial load:
 *   getUnit, getSpace, getItems, getStageConfigs, getStageAssignment("item", spaceId),
 *   getLabelConfigs, getLabelAssignment(spaceId)
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
    const { supabase } = auth.ctx;

    const [
      unitResult,
      spaceResult,
      itemsResult,
      stageConfigsResult,
      stageAssignmentResult,
      labelConfigsResult,
      labelAssignmentResult,
    ] = await Promise.all([
      supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .returns<UnitRow[]>()
        .single(),
      supabase
        .from("spaces")
        .select("*")
        .eq("id", spaceId)
        .returns<SpaceRow[]>()
        .single(),
      supabase
        .from("items")
        .select("*")
        .eq("space_id", spaceId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .returns<ItemRow[]>(),
      supabase
        .from("stage_configs")
        .select("*")
        .order("created_at", { ascending: true })
        .returns<StageConfigRow[]>(),
      supabase
        .from("stage_assignments")
        .select("*")
        .eq("entity_type", "item")
        .eq("parent_id", spaceId)
        .limit(1),
      supabase
        .from("label_configs")
        .select("*")
        .order("created_at", { ascending: true })
        .returns<LabelConfigRow[]>(),
      supabase
        .from("label_assignments")
        .select("*")
        .eq("parent_id", spaceId)
        .limit(1),
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

    if (
      itemsResult.error ||
      stageConfigsResult.error ||
      stageAssignmentResult.error ||
      labelConfigsResult.error ||
      labelAssignmentResult.error
    ) {
      logger.error("Error in getItemsDashboardData:", {
        items: itemsResult.error,
        stageConfigs: stageConfigsResult.error,
        stageAssignment: stageAssignmentResult.error,
        labelConfigs: labelConfigsResult.error,
        labelAssignment: labelAssignmentResult.error,
      });
      return { success: false, error: "Failed to load dashboard data" };
    }

    return {
      success: true,
      data: {
        unit: unitResult.data,
        space: spaceResult.data,
        items: itemsResult.data ?? [],
        stageConfigs: stageConfigsResult.data ?? [],
        stageAssignment:
          (stageAssignmentResult.data?.[0] as StageAssignment) ?? null,
        labelConfigs: labelConfigsResult.data ?? [],
        labelAssignment:
          (labelAssignmentResult.data?.[0] as LabelAssignment) ?? null,
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getItemsDashboardData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
