import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import type { ActionResponse, ContactRow } from "@/lib/types";

export const runtime = "nodejs";

const MAX_CONTACT_ROWS = 2000;
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns encrypted contacts for the current user. */
export async function GET(): Promise<
  NextResponse<ActionResponse<ContactRow[]>>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("category_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_CONTACT_ROWS + 1)
      .overrideTypes<ContactRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting contacts via API route", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get contacts",
        },
        { headers: NO_STORE_HEADERS }
      );
    }
    if ((contacts?.length ?? 0) > MAX_CONTACT_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many contacts to load in one request",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: contacts ?? [],
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in contacts GET route", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
