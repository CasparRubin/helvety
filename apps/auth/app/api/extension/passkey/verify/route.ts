import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ExtensionPasskeyAuthResponseSchema,
  verifyExtensionPasskeyAuthentication,
} from "@/lib/extension-passkey-api";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

const BodySchema = z.object({
  origin: z.string().min(1),
  challengeEnvelope: z.string().min(1),
  credential: ExtensionPasskeyAuthResponseSchema,
});

/**
 *
 */
export async function POST(request: Request) {
  const headersList = await headers();
  const clientIP = getTrustedClientIp(headersList, {
    requireTrustedProxyInProduction: true,
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const result = await verifyExtensionPasskeyAuthentication({
    request,
    clientIP,
    origin: parsed.data.origin,
    challengeEnvelope: parsed.data.challengeEnvelope,
    credential: parsed.data.credential,
  });

  if (!result.ok) {
    const status =
      result.error === "Not authenticated"
        ? 401
        : result.error.includes("Too many")
          ? 429
          : 400;
    return NextResponse.json(
      { success: false, error: result.error },
      { status, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, data: { userId: result.userId } },
    { headers: NO_STORE_HEADERS }
  );
}
