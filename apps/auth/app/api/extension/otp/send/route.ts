import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import {
  ExtensionOtpSendBodySchema,
  sendExtensionOtp,
  type ExtensionOtpSendPayload,
} from "@/lib/extension-otp";

import type { ActionResponse } from "@helvety/shared/types/entities";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** POST /api/extension/otp/send — Chromium extension OTP send (no Bearer). */
export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<ExtensionOtpSendPayload>>> {
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

    const parsed = ExtensionOtpSendBodySchema.safeParse(body);
    if (!parsed.success) {
      const origin =
        typeof body === "object" &&
        body !== null &&
        "origin" in body &&
        typeof (body as { origin?: unknown }).origin === "string"
          ? (body as { origin: string }).origin
          : null;
      const error = origin?.startsWith("chrome-extension://")
        ? "Extension id is not allowlisted on helvety-auth (HELVETY_CHROME_EXTENSION_ORIGINS). Add the id from About → Extension ID on Vercel, then redeploy."
        : "Invalid request body";
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

    const result = await sendExtensionOtp({
      email: parsed.data.email,
      nonEUEEAConfirmed: parsed.data.nonEUEEAConfirmed,
      origin: parsed.data.origin,
      clientIP,
    });

    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.logUnexpectedError("Extension OTP send route failed", error);
    return NextResponse.json(
      { success: false, error: "Request to Helvety auth failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
