import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  ENCRYPTED_PREFETCH_COLUMNS,
  encryptedPrefetchAuthOptions,
} from "@helvety/shared/encrypted-prefetch-api";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { NextResponse } from "next/server";

import { MAX_DOC_ROWS } from "@/lib/constants";

import type { ActionResponse, DocRow } from "@/lib/types";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns encrypted vault documents for the current user. */
export async function GET(): Promise<NextResponse<ActionResponse<DocRow[]>>> {
  try {
    const auth = await authenticateAndRateLimit(
      encryptedPrefetchAuthOptions("docs")
    );
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: docs, error } = await supabase
      .from("docs")
      .select(ENCRYPTED_PREFETCH_COLUMNS.docs)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(MAX_DOC_ROWS + 1)
      .overrideTypes<DocRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error listing documents via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to load documents" },
        { headers: NO_STORE_HEADERS }
      );
    }
    if ((docs?.length ?? 0) > MAX_DOC_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many documents to load in one request",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: docs ?? [] },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      unexpectedActionError("Unexpected error in docs GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
