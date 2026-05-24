import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  ENCRYPTED_PREFETCH_COLUMNS,
  encryptedPrefetchAuthOptions,
} from "@helvety/shared/encrypted-prefetch-api";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { isUuidString } from "@helvety/shared/uuid-string";
import { NextResponse } from "next/server";

import type { ActionResponse, ItemRow } from "@/lib/types";

export const runtime = "nodejs";
const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** Returns one encrypted task for the current user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ActionResponse<ItemRow>>> {
  try {
    const { id } = await params;
    if (!isUuidString(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid task ID" },
        { headers: NO_STORE_HEADERS }
      );
    }

    const auth = await authenticateAndRateLimit(
      encryptedPrefetchAuthOptions("tasks")
    );
    if (!auth.ok) {
      return NextResponse.json(auth.response, { headers: NO_STORE_HEADERS });
    }
    const { user, supabase } = auth.ctx;

    const { data: item, error } = await supabase
      .from("items")
      .select(ENCRYPTED_PREFETCH_COLUMNS.items)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !item) {
      if (error?.code === "PGRST116" || !item) {
        return NextResponse.json(
          { success: false, error: "Task not found" },
          { headers: NO_STORE_HEADERS }
        );
      }
      logger.logUnexpectedError("Error getting task via API route", error);
      return NextResponse.json(
        { success: false, error: "Failed to load task" },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: item },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      unexpectedActionError("Unexpected error in task GET route", error),
      { headers: NO_STORE_HEADERS }
    );
  }
}
