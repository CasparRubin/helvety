import "server-only";

import { isRetryableAuthTransportError } from "./auth-errors";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

/** Backoff delays between transport retries (ms). */
const TRANSPORT_RETRY_BACKOFF_MS = [150, 400] as const;

/** Number of transport retries after the initial getUser() attempt. */
const MAX_TRANSPORT_RETRIES = 2;

/** Pauses execution for bounded transport retry backoff. */
async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Converts a thrown value into an AuthError-shaped object for callers. */
function toAuthError(thrown: unknown): AuthError {
  if (thrown && typeof thrown === "object" && "message" in thrown) {
    return thrown as AuthError;
  }

  const message =
    thrown instanceof Error ? thrown.message : "Auth request failed";

  return {
    message,
    name: thrown instanceof Error ? thrown.name : "AuthError",
    status: 0,
  } as AuthError;
}

/**
 * Wrapper around supabase.auth.getUser() with fail-closed auth semantics.
 *
 * Definitive auth failures (invalid session, revoked refresh token, expired JWT)
 * return immediately with no retries. Transient transport failures (network
 * blips, timeouts, 5xx) are retried up to {@link MAX_TRANSPORT_RETRIES} times
 * with short backoff so SSR survives the mobile resume window without treating
 * a reachable session as logged out.
 */
export async function getAuthUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; error: AuthError | null }> {
  let lastError: AuthError | null = null;

  for (let attempt = 0; attempt <= MAX_TRANSPORT_RETRIES; attempt++) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user) {
        return { user, error: null };
      }

      if (!error) {
        return { user: null, error: null };
      }

      lastError = error;

      if (
        !isRetryableAuthTransportError(error) ||
        attempt >= MAX_TRANSPORT_RETRIES
      ) {
        return { user: null, error };
      }
    } catch (thrown) {
      const authError = toAuthError(thrown);
      lastError = authError;

      if (
        !isRetryableAuthTransportError(thrown) ||
        attempt >= MAX_TRANSPORT_RETRIES
      ) {
        return { user: null, error: authError };
      }
    }

    const backoff = TRANSPORT_RETRY_BACKOFF_MS[attempt];
    if (backoff !== undefined) {
      await sleep(backoff);
    }
  }

  return { user: null, error: lastError };
}
