"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  isDashboardPrefetchOverCap,
} from "@helvety/shared/dashboard-prefetch";
import { fetchLinksLibraryPrefetchRows } from "@helvety/shared/encrypted-prefetch-queries";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";

import type {
  ActionResponse,
  LinkFolderRow,
  LinkRow,
  LinksDashboardData,
} from "@/lib/types";

/**
 * Prefetch encrypted folders and links for the dashboard's initial server render.
 */
export async function getLinksDashboardData(): Promise<
  ActionResponse<LinksDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "links" });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { folders, links } = await fetchLinksLibraryPrefetchRows<
      LinkFolderRow,
      LinkRow
    >(supabase, user.id, ACTION_LIMITS.MAX_DASHBOARD_ROWS);

    if (folders.error) {
      logger.logUnexpectedError(
        "Error in getLinksDashboardData (folders)",
        folders.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }
    if (links.error) {
      logger.logUnexpectedError(
        "Error in getLinksDashboardData (links)",
        links.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (
      isDashboardPrefetchOverCap(
        folders.data?.length ?? 0,
        ACTION_LIMITS.MAX_DASHBOARD_ROWS
      ) ||
      isDashboardPrefetchOverCap(
        links.data?.length ?? 0,
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
        folders: folders.data ?? [],
        links: links.data ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getLinksDashboardData",
      error
    );
  }
}
