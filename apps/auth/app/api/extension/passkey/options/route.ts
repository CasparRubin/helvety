import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import {
  extensionOriginParseBodyError,
  extractExtensionOriginFromBody,
} from "@/lib/extension-auth-errors";
import { authenticateBearerRequest } from "@/lib/extension-bearer-auth";
import {
  ExtensionPasskeyOptionsBodySchema,
  generateExtensionPasskeyOptions,
  type ExtensionPasskeyOptionsPayload,
} from "@/lib/extension-passkey";

import type { ActionResponse } from "@helvety/shared/types/entities";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/** POST /api/extension/passkey/options — Bearer JSON for Chromium extension unlock. */
export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<ExtensionPasskeyOptionsPayload>>> {
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

    const parsed = ExtensionPasskeyOptionsBodySchema.safeParse(body);
    if (!parsed.success) {
      const error = extensionOriginParseBodyError(
        extractExtensionOriginFromBody(body)
      );
      return NextResponse.json(
        { success: false, error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (parsed.data.expectedUserId !== auth.ctx.user.id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    // Strict mode: only trust x-real-ip from the platform proxy in production
    // (matches callback/server-action guards); a missing IP fails closed in
    // checkPasskeyRateLimit rather than diluting limits via spoofed headers.
    const clientIP = getTrustedClientIp(request.headers, {
      requireTrustedProxyInProduction: true,
    });

    const result = await generateExtensionPasskeyOptions({
      userId: auth.ctx.user.id,
      origin: parsed.data.origin,
      isMobile: parsed.data.isMobile,
      clientIP,
    });

    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status, headers: NO_STORE_HEADERS });
  } catch (error) {
    logger.logUnexpectedError("Extension passkey options route failed", error);
    return NextResponse.json(
      { success: false, error: "Request to Helvety auth failed" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
