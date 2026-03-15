import "server-only";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

const TRANSIENT_AUTH_ERROR_PATTERNS = [
  "failed to fetch",
  "network",
  "timeout",
  "timed out",
  "connection",
  "econnreset",
  "econnrefused",
  "etimedout",
  "temporary",
  "temporarily unavailable",
];

/** Returns true when the auth error appears transient/retriable. */
function isTransientAuthError(error: AuthError | null): boolean {
  if (!error) {
    return false;
  }

  if (typeof error.status === "number") {
    if (error.status === 408 || error.status === 425) {
      return true;
    }

    if (error.status >= 500) {
      return true;
    }
  }

  const message = error.message.toLowerCase();
  return TRANSIENT_AUTH_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
}

/**
 * Retry-aware wrapper around supabase.auth.getUser().
 *
 * On unreliable networks (VPN, Private Relay, mobile), a single getUser()
 * call can fail due to transient issues (DNS hiccup, TCP reset, timeout).
 * This helper retries transient auth/network failures with a short delay
 * before giving up, preventing unnecessary login redirects caused by
 * momentary network blips.
 *
 * @param supabase - Supabase client instance
 * @param maxRetries - Number of retries after the initial attempt (default: 1)
 * @param delayMs - Delay between retries in milliseconds (default: 500)
 * @returns The user and error from the last attempt
 */
export async function getUserWithRetry(
  supabase: SupabaseClient,
  maxRetries = 1,
  delayMs = 500
): Promise<{ user: User | null; error: AuthError | null }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Success - return immediately
    if (user) {
      return { user, error: null };
    }

    // Retry only when we have evidence of a transient auth/network failure.
    const shouldRetry =
      attempt < maxRetries && isTransientAuthError(error ?? null);
    if (!shouldRetry) {
      return { user: null, error: error ?? null };
    }

    // Transient failure - wait briefly before retrying
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // TypeScript exhaustiveness (unreachable)
  return { user: null, error: null };
}
