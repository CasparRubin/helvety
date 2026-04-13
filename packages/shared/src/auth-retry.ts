import "server-only";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Single-shot wrapper around supabase.auth.getUser().
 *
 * Fail-closed: one call, no retries. If the session is dead, ambiguous,
 * or in any non-success state, the caller should treat it as unauthenticated
 * and redirect to login (or hard logout when appropriate).
 */
export async function getAuthUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; error: AuthError | null }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user: user ?? null, error: error ?? null };
}
