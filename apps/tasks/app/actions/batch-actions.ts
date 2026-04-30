"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";

import type { ActionResponse, ItemRow } from "@/lib/types";

/** Data returned by the flat Tasks dashboard batch fetch. */
interface FlatItemsDashboardData {
  items: ItemRow[];
}

/**
 * Prefetch encrypted tasks for the flat dashboard's initial server render.
 * Returns the items payload used to hydrate the client before route-handler refreshes.
 */
export async function getFlatItemsDashboardData(): Promise<
  ActionResponse<FlatItemsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "tasks" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const itemsResult = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1)
      .overrideTypes<ItemRow[], { merge: false }>();

    if (itemsResult.error) {
      logger.logUnexpectedError(
        "Error in getFlatItemsDashboardData",
        itemsResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if ((itemsResult.data?.length ?? 0) > ACTION_LIMITS.MAX_DASHBOARD_ROWS) {
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
