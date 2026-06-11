import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
  isDashboardPrefetchOverCap,
} from "@helvety/shared/dashboard-prefetch";
import { encryptedPrefetchAuthOptions } from "@helvety/shared/encrypted-prefetch-api";
import {
  ENCRYPTED_PREFETCH_API_MAX_ROWS,
  fetchLinksLibraryPrefetchRows,
} from "@helvety/shared/encrypted-prefetch-queries";
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

/** Returns encrypted folders and links for the current user. */
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

    const { folders, links } = await fetchLinksLibraryPrefetchRows<
      LinkFolderRow,
      LinkRow
    >(supabase, user.id, ENCRYPTED_PREFETCH_API_MAX_ROWS);

    if (folders.error || links.error) {
      logger.logUnexpectedError(
        "Error getting library via API route",
        folders.error ?? links.error
      );
      return NextResponse.json(
        { success: false, error: "Failed to load library" },
        { headers: NO_STORE_HEADERS }
      );
    }

    if (
      isDashboardPrefetchOverCap(
        folders.data?.length ?? 0,
        ENCRYPTED_PREFETCH_API_MAX_ROWS
      ) ||
      isDashboardPrefetchOverCap(
        links.data?.length ?? 0,
        ENCRYPTED_PREFETCH_API_MAX_ROWS
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          folders: folders.data ?? [],
          links: links.data ?? [],
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
