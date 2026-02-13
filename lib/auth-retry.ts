import "server-only";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Retry-aware wrapper around supabase.auth.getUser().
 *
 * On unreliable networks (VPN, Private Relay, mobile), a single getUser()
 * call can fail due to transient issues (DNS hiccup, TCP reset, timeout).
 * This helper retries once with a short delay before giving up, preventing
 * unnecessary login redirects caused by momentary network blips.
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

    // Success — return immediately
    if (user) {
      return { user, error: null };
    }

    // Last attempt failed — return the error
    if (attempt >= maxRetries) {
      return { user: null, error: error ?? null };
    }

    // Transient failure — wait briefly before retrying
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // TypeScript exhaustiveness (unreachable)
  return { user: null, error: null };
}
