import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildExtensionPasskeyAuthenticationOptions } from "@/lib/extension-passkey-api";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

const BodySchema = z.object({
  origin: z.string().min(1),
  isMobile: z.boolean().optional(),
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

  const result = await buildExtensionPasskeyAuthenticationOptions({
    request,
    clientIP,
    origin: parsed.data.origin,
    isMobile: parsed.data.isMobile === true,
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
    {
      success: true,
      data: {
        optionsJSON: result.optionsJSON,
        challengeEnvelope: result.challengeEnvelope,
      },
    },
    { headers: NO_STORE_HEADERS }
  );
}
