import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { NextResponse } from "next/server";

import type { ActionResponse, DocRow } from "@/lib/types";

export const runtime = "nodejs";
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns one encrypted vault document for the current user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ActionResponse<DocRow>>> {
  try {
    const { id } = await params;
    if (!isUuidString(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid document ID" },
        { headers: NO_STORE_HEADERS }
      );
    }

    const auth = await authenticateAndRateLimit({ rateLimitPrefix: "docs" });
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: doc, error } = await supabase
      .from("docs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !doc) {
      if (error?.code === "PGRST116" || !doc) {
        return NextResponse.json(
          { success: false, error: "Document not found" },
          { headers: NO_STORE_HEADERS }
        );
      }
      logger.logUnexpectedError("Error getting document via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to load document" },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: doc },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      unexpectedActionError("Unexpected error in doc GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
