import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import type { ActionResponse, ItemRow } from "@/lib/types";

export const runtime = "nodejs";

const MAX_ITEM_ROWS = 2000;
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns encrypted notes for the current user. */
export async function GET(): Promise<NextResponse<ActionResponse<ItemRow[]>>> {
  try {
    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_ITEM_ROWS + 1)
      .overrideTypes<ItemRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting notes via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to get notes" },
        { headers: NO_STORE_HEADERS }
      );
    }
    if ((items?.length ?? 0) > MAX_ITEM_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many notes to load in one request",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: items ?? [] },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in notes GET route", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
