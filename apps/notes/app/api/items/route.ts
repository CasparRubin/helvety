import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { NOTES_PREFETCH_TOO_MANY_ROWS_ERROR } from "@helvety/shared/dashboard-prefetch";
import { encryptedPrefetchAuthOptions } from "@helvety/shared/encrypted-prefetch-api";
import {
  ENCRYPTED_PREFETCH_API_MAX_ROWS,
  fetchNotesPrefetchRows,
} from "@helvety/shared/encrypted-prefetch-queries";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { NextResponse } from "next/server";

import type { ActionResponse, ItemRow } from "@/lib/types";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns encrypted notes for the current user. */
export async function GET(): Promise<NextResponse<ActionResponse<ItemRow[]>>> {
  try {
    const auth = await authenticateAndRateLimit(
      encryptedPrefetchAuthOptions("notes")
    );
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await fetchNotesPrefetchRows<ItemRow>(
      supabase,
      user.id,
      ENCRYPTED_PREFETCH_API_MAX_ROWS
    );

    if (error) {
      logger.logUnexpectedError("Error getting notes via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to load notes" },
        { headers: NO_STORE_HEADERS }
      );
    }
    if ((items?.length ?? 0) > ENCRYPTED_PREFETCH_API_MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: NOTES_PREFETCH_TOO_MANY_ROWS_ERROR,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: items ?? [] },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      unexpectedActionError("Unexpected error in notes GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
