import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { isUuidString } from "@helvety/shared/uuid-string";
import { NextResponse } from "next/server";

import type { ActionResponse, ContactRow } from "@/lib/types";

export const runtime = "nodejs";
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns a single encrypted contact for the current user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ActionResponse<ContactRow>>> {
  try {
    const { id } = await params;
    if (!isUuidString(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid contact ID",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !contact) {
      if (error?.code === "PGRST116" || !contact) {
        return NextResponse.json(
          {
            success: false,
            error: "Contact not found",
          },
          { headers: NO_STORE_HEADERS }
        );
      }
      logger.logUnexpectedError("Error getting contact via API route", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get contact",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: contact,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in contact GET route", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
