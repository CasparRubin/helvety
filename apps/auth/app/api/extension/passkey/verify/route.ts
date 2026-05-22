import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { authenticateBearerRequest } from "@/lib/extension-bearer-auth";
import {
  ExtensionPasskeyVerifyBodySchema,
  verifyExtensionPasskey,
} from "@/lib/extension-passkey";

import type { ActionResponse } from "@helvety/shared/types/entities";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** POST /api/extension/passkey/verify — Bearer JSON; does not replace extension OTP session. */
export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<{ userId: string }>>> {
  try {
    const auth = await authenticateBearerRequest(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const parsed = ExtensionPasskeyVerifyBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const headersList = await headers();
    const clientIP = getTrustedClientIp(headersList, {
      requireTrustedProxyInProduction: true,
    });

    const result = await verifyExtensionPasskey({
      userId: auth.ctx.user.id,
      origin: parsed.data.origin,
      credential: parsed.data.credential,
      clientIP,
    });

    const status = result.success ? 200 : 400;

    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.logUnexpectedError("Extension passkey verify route failed", error);
    return NextResponse.json(
      { success: false, error: "Request to Helvety auth failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
