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
}

/** Shared in-memory state for deduplicating closely timed auth probes. */
let inFlightGetUser: Promise<GetUserResponse> | null = null;
let lastResolvedAt = 0;
let lastResolvedResult: GetUserResponse | null = null;
let rateLimitBackoffMs = 0;
let blockedUntil = 0;
const RATE_LIMIT_BACKOFF_BASE_MS = 5_000;
const RATE_LIMIT_BACKOFF_MAX_MS = 60_000;

/** Returns true when an auth error indicates request rate-limiting. */
function isRateLimitError(
  error: GetUserResponse["error"] | null | undefined
): boolean {
  if (!error) {
    return false;
  }

  if (typeof error.status === "number" && error.status === 429) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("too many requests") ||
    message.includes("request rate limit reached") ||
    message.includes("429")
  );
}

/** Remaining client backoff time for auth probes in milliseconds. */
export function getAuthProbeBlockRemainingMs(): number {
  return Math.max(0, blockedUntil - Date.now());
}

/** Test-only helper to clear module-level auth probe state. */
export function resetAuthProbeSingleflightStateForTests(): void {
  inFlightGetUser = null;
  lastResolvedAt = 0;
  lastResolvedResult = null;
  rateLimitBackoffMs = 0;
  blockedUntil = 0;
}

/**
 * Coalesces concurrent auth.getUser() calls and applies a short cooldown cache.
 * This reduces auth token refresh pressure when multiple UI probes run together.
 */
export async function getUserSingleflight(
  supabase: SupabaseBrowserClient,
  options?: GetUserSingleflightOptions
): Promise<GetUserResponse> {
  const cooldownMs = options?.cooldownMs ?? 1_500;
  const now = Date.now();

  if (inFlightGetUser) {
    return await inFlightGetUser;
  }

  if (lastResolvedResult && now - lastResolvedAt < cooldownMs) {
    return lastResolvedResult;
  }

  if (Date.now() < blockedUntil && lastResolvedResult) {
    return lastResolvedResult;
  }

  inFlightGetUser = supabase.auth
    .getUser()
    .then((result) => {
      lastResolvedResult = result;
      lastResolvedAt = Date.now();

      if (isRateLimitError(result.error)) {
        rateLimitBackoffMs =
          rateLimitBackoffMs > 0
            ? Math.min(rateLimitBackoffMs * 2, RATE_LIMIT_BACKOFF_MAX_MS)
            : RATE_LIMIT_BACKOFF_BASE_MS;
        blockedUntil = Date.now() + rateLimitBackoffMs;
      } else {
        // Reset after non-rate-limited responses so normal probes recover quickly.
        rateLimitBackoffMs = 0;
        blockedUntil = 0;
      }

      return result;
    })
    .finally(() => {
      inFlightGetUser = null;
    });

  return await inFlightGetUser;
}
