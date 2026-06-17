import "server-only";

import { getSupabaseKey, getSupabaseUrl } from "@helvety/shared/env-validation";
import { createClient } from "@supabase/supabase-js";

import type { User } from "@helvety/shared/supabase-types";

const NOT_AUTHENTICATED = "Not authenticated";

/** Authenticated extension user from Bearer JWT validation. */
export type BearerAuthContext = {
  user: User;
};

/**
 * Validates a Bearer JWT from the Helvety Chromium extension action popup.
 * Does not create cookies — the extension keeps its own session in `chrome.storage.local`.
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

  return { ok: true, ctx: { user } };
}
