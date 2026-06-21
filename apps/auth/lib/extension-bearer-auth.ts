import "server-only";

import { getSupabaseKey, getSupabaseUrl } from "@helvety/shared/env-validation";
import { verifyExtensionWeeklyProof } from "@helvety/shared/extension-weekly-proof-server";
import { EXTENSION_WEEKLY_PROOF_HEADER } from "@helvety/shared/weekly-proof-token";
import { createClient } from "@supabase/supabase-js";

import type { User } from "@helvety/shared/supabase-types";

const NOT_AUTHENTICATED = "Not authenticated";
const WEEKLY_PROOF_REQUIRED =
  "Weekly email verification expired. Sign out and sign in again.";

/** Authenticated extension user from Bearer JWT + weekly proof validation. */
export type BearerAuthContext = {
  user: User;
  weeklyProof: string;
};

/**
 * Validates a Bearer JWT from the Helvety Chromium extension side panel and
 * requires a server-HMAC weekly proof (parity with web device trust).
 */
export async function authenticateBearerRequest(
  request: Request
): Promise<
  { ok: true; ctx: BearerAuthContext } | { ok: false; error: string }
> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: NOT_AUTHENTICATED };
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return { ok: false, error: NOT_AUTHENTICATED };
  }

  const weeklyProof = request.headers
    .get(EXTENSION_WEEKLY_PROOF_HEADER)
    ?.trim();
  if (!weeklyProof) {
    return { ok: false, error: WEEKLY_PROOF_REQUIRED };
  }

  const url = getSupabaseUrl();
  const publishableKey = getSupabaseKey();
  const supabase = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: NOT_AUTHENTICATED };
  }

  const verifiedProof = verifyExtensionWeeklyProof(weeklyProof, user.id);
  if (!verifiedProof) {
    return { ok: false, error: WEEKLY_PROOF_REQUIRED };
  }

  return { ok: true, ctx: { user, weeklyProof } };
}
