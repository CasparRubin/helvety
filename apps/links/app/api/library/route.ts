import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { isDashboardPrefetchOverCap } from "@helvety/shared/dashboard-prefetch";
import {
  ENCRYPTED_PREFETCH_COLUMNS,
  encryptedPrefetchAuthOptions,
} from "@helvety/shared/encrypted-prefetch-api";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { NextResponse } from "next/server";

import type {
  ActionResponse,
  LinkFolderRow,
  LinkRow,
  LinksDashboardData,
} from "@/lib/types";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/**
 *
 */
export async function GET(): Promise<
  NextResponse<ActionResponse<LinksDashboardData>>
> {
  try {
    const auth = await authenticateAndRateLimit(
      encryptedPrefetchAuthOptions("links")
    );
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const [foldersResult, linksResult] = await Promise.all([
      supabase
        .from("link_folders")
        .select(ENCRYPTED_PREFETCH_COLUMNS.link_folders)
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1)
        .overrideTypes<LinkFolderRow[], { merge: false }>(),
      supabase
        .from("links")
        .select(ENCRYPTED_PREFETCH_COLUMNS.links)
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1)
        .overrideTypes<LinkRow[], { merge: false }>(),
    ]);

    if (foldersResult.error || linksResult.error) {
      logger.logUnexpectedError(
        "Error getting library via API route",
        foldersResult.error ?? linksResult.error
      );
      return NextResponse.json(
        { success: false, error: "Failed to load library" },
        { headers: NO_STORE_HEADERS }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "Too many items to load in one request",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          folders: foldersResult.data ?? [],
          links: linksResult.data ?? [],
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      unexpectedActionError("Unexpected error in library GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
