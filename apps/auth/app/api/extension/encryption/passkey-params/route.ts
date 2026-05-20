import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { fetchUserPasskeyParamsForUser } from "@helvety/shared/user-passkey-params-db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getUserFromBearerAuthHeader } from "@/lib/extension-auth-user";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "cache-control": "no-store, max-age=0" };

/**
 * Returns PRF / passkey encryption params for the Bearer-authenticated user
 * (Chromium extension unlock flow). Like any authenticated API, the bearer token
 * is visible to this server over TLS; response is encryption metadata only — not entity plaintext.
 */
export async function GET(request: Request) {
  const headersList = await headers();
  const clientIP = getTrustedClientIp(headersList, {
    requireTrustedProxyInProduction: true,
  });
  if (!clientIP) {
    return NextResponse.json(
      { success: false, error: "Unable to verify request" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const auth = await getUserFromBearerAuthHeader(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const rl = await checkRateLimit(
    `ext_passkey_params:user:${auth.user.id}`,
    RATE_LIMITS.CREDENTIAL_READ.maxRequests,
    RATE_LIMITS.CREDENTIAL_READ.windowMs,
    "encryption"
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  const row = await fetchUserPasskeyParamsForUser(
    auth.supabase,
    auth.user.id,
    "Extension API passkey params"
  );
  if (!row.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to load encryption params" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { success: true, data: row.params },
    { headers: NO_STORE_HEADERS }
  );
}
