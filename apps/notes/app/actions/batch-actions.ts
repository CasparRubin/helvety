"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  isDashboardPrefetchOverCap,
} from "@helvety/shared/dashboard-prefetch";
import { fetchNotesPrefetchRows } from "@helvety/shared/encrypted-prefetch-queries";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";

import type { ActionResponse, ItemRow } from "@/lib/types";

/** Data returned by the Notes dashboard batch fetch. */
interface FlatItemsDashboardData {
  items: ItemRow[];
}

/**
 * Prefetch encrypted notes for the main dashboard's initial server render.
 * Returns the notes list payload used to hydrate the client before route-handler refreshes.
 */
export async function getFlatItemsDashboardData(): Promise<
  ActionResponse<FlatItemsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const itemsResult = await fetchNotesPrefetchRows<ItemRow>(
      supabase,
      user.id,
      ACTION_LIMITS.MAX_DASHBOARD_ROWS
    );

    if (itemsResult.error) {
      logger.logUnexpectedError(
        "Error in getFlatItemsDashboardData",
        itemsResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (
      isDashboardPrefetchOverCap(
        itemsResult.data?.length ?? 0,
        ACTION_LIMITS.MAX_DASHBOARD_ROWS
      )
    ) {
      return {
        success: false,
        error: DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
      };
    }

    return {
      success: true,
      data: {
        items: itemsResult.data ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getFlatItemsDashboardData",
      error
    );
  }
}
