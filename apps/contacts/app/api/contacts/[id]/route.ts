import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  ENCRYPTED_PREFETCH_COLUMNS,
  encryptedPrefetchAuthOptions,
} from "@helvety/shared/encrypted-prefetch-api";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
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

    const auth = await authenticateAndRateLimit(
      encryptedPrefetchAuthOptions("contacts")
    );
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: contact, error } = await supabase
      .from("contacts")
      .select(ENCRYPTED_PREFETCH_COLUMNS.contacts)
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
          error: "Failed to load contact",
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
    return NextResponse.json(
      unexpectedActionError("Unexpected error in contact GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
