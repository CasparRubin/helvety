"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";

import type { ActionResponse, ItemRow } from "@/lib/types";

const MAX_DASHBOARD_ROWS = 2000;

/** Data returned by the flat Notes dashboard batch fetch. */
export interface FlatItemsDashboardData {
  items: ItemRow[];
}

/**
 * Batch fetch all data needed for the flat Notes dashboard.
 * Returns all items across the current user.
 */
export async function getFlatItemsDashboardData(): Promise<
  ActionResponse<FlatItemsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const itemsResult = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_DASHBOARD_ROWS + 1)
      .returns<ItemRow[]>();

    if (itemsResult.error) {
      logger.logUnexpectedError(
        "Error in getFlatItemsDashboardData",
        itemsResult.error
      );
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
        items: itemsResult.data ?? [],
      },
    };
  } catch (error) {
    logger.logUnexpectedError(
      "Unexpected error in getFlatItemsDashboardData",
      error
    );
    return { success: false, error: "An unexpected error occurred" };
  }
}
