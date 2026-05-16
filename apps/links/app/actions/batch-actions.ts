"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  isDashboardPrefetchOverCap,
} from "@helvety/shared/dashboard-prefetch";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";

import type {
  ActionResponse,
  LinkFolderRow,
  LinkRow,
  LinksDashboardData,
} from "@/lib/types";

/**
 *
 */
export async function getLinksDashboardData(): Promise<
  ActionResponse<LinksDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "links" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [foldersResult, linksResult] = await Promise.all([
      supabase
        .from("link_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1)
        .overrideTypes<LinkFolderRow[], { merge: false }>(),
      supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1)
        .overrideTypes<LinkRow[], { merge: false }>(),
    ]);

    if (foldersResult.error) {
      logger.logUnexpectedError(
        "Error in getLinksDashboardData (folders)",
        foldersResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }
    if (linksResult.error) {
      logger.logUnexpectedError(
        "Error in getLinksDashboardData (links)",
        linksResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (
      isDashboardPrefetchOverCap(
        foldersResult.data?.length ?? 0,
        ACTION_LIMITS.MAX_DASHBOARD_ROWS
      ) ||
      isDashboardPrefetchOverCap(
        linksResult.data?.length ?? 0,
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
        folders: foldersResult.data ?? [],
        links: linksResult.data ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getLinksDashboardData",
      error
    );
  }
}
