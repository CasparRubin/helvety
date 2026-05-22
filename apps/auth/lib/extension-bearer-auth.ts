import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient, User } from "@supabase/supabase-js";

const NOT_AUTHENTICATED = "Not authenticated";

/** Supabase client authenticated via `Authorization: Bearer` (extension OTP session). */
export type BearerAuthContext = {
  user: User;
  supabase: SupabaseClient;
};

/**
 * Validates a Bearer JWT from the Helvety Chromium extension popup.
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return { ok: false, error: "Auth service is not configured" };
  }

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

  return { ok: true, ctx: { user, supabase } };
}
