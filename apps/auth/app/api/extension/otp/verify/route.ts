import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import {
  extensionOriginParseBodyError,
  extractExtensionOriginFromBody,
} from "@/lib/extension-auth-errors";
import {
  ExtensionOtpVerifyBodySchema,
  verifyExtensionOtp,
} from "@/lib/extension-otp";

import type { OtpVerifySessionPayload } from "@/lib/otp-send-verify-core";
import type { ActionResponse } from "@helvety/shared/types/entities";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** POST /api/extension/otp/verify — returns session tokens for extension storage. */
export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<OtpVerifySessionPayload>>> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const parsed = ExtensionOtpVerifyBodySchema.safeParse(body);
    if (!parsed.success) {
      const error = extensionOriginParseBodyError(
        extractExtensionOriginFromBody(body)
      );
      return NextResponse.json(
        { success: false, error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const clientIP = getTrustedClientIp(request.headers, {
      requireTrustedProxyInProduction: true,
    });
    if (!clientIP) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to process request. Please try again.",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const result = await verifyExtensionOtp({
      email: parsed.data.email,
      code: parsed.data.code,
      origin: parsed.data.origin,
      clientIP,
    });

    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.logUnexpectedError("Extension OTP verify route failed", error);
    return NextResponse.json(
      { success: false, error: "Request to Helvety auth failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
