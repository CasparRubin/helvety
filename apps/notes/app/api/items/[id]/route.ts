import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { isUuidString } from "@helvety/shared/uuid-string";
import { NextResponse } from "next/server";

import type { ActionResponse, ItemRow } from "@/lib/types";

export const runtime = "nodejs";
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns one encrypted note for the current user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ActionResponse<ItemRow>>> {
  try {
    const { id } = await params;
    if (!isUuidString(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid note ID" },
        { headers: NO_STORE_HEADERS }
      );
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "notes" });
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: item, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return NextResponse.json(
          { success: false, error: "Note not found" },
          { headers: NO_STORE_HEADERS }
        );
      }
      logger.logUnexpectedError("Error getting note via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to get note" },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: item },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in note GET route", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
