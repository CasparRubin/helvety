"use client";

import type { createBrowserClient } from "@helvety/shared/supabase/client";

/** Normalized response type of supabase.auth.getUser(). */
type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

/** Resolved promise type of a single auth.getUser() call. */
type GetUserResponse = Awaited<
  ReturnType<SupabaseBrowserClient["auth"]["getUser"]>
>;

/** Runtime options for auth.getUser() coalescing behavior. */
interface GetUserSingleflightOptions {
  cooldownMs?: number;
  bypassCooldown?: boolean;
}

/** Shared in-memory state for deduplicating closely timed auth probes. */
let inFlightGetUser: Promise<GetUserResponse> | null = null;
let lastResolvedAt = 0;
let lastResolvedResult: GetUserResponse | null = null;

/**
 * Coalesces concurrent auth.getUser() calls and applies a short cooldown cache.
 * This reduces auth token refresh pressure when multiple UI probes run together.
 */
export async function getUserSingleflight(
  supabase: SupabaseBrowserClient,
  options?: GetUserSingleflightOptions
): Promise<GetUserResponse> {
  const cooldownMs = options?.cooldownMs ?? 1_500;
  const bypassCooldown = options?.bypassCooldown ?? false;

  if (inFlightGetUser) {
    return await inFlightGetUser;
  }

  if (
    !bypassCooldown &&
    lastResolvedResult &&
    Date.now() - lastResolvedAt < cooldownMs
  ) {
    return lastResolvedResult;
  }

  inFlightGetUser = supabase.auth
    .getUser()
    .then((result) => {
      lastResolvedResult = result;
      lastResolvedAt = Date.now();
      return result;
    })
    .finally(() => {
      inFlightGetUser = null;
    });

  return await inFlightGetUser;
}
