import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

import { getClientSupabaseKey, getClientSupabaseUrl } from "../client-env";

import { browserFetchWithTimeout } from "./fetch-with-timeout";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton instance of the Supabase client for browser usage.
 * This prevents creating multiple client instances, improving performance.
 */
let browserClient: SupabaseClient<DatabaseSchema> | null = null;

/**
 * Auth lock wrapper with timeout and fallback queue.
 *
 * Safari iOS and some Android browsers can hold Web Locks indefinitely
 * when tabs are suspended/resumed, causing the Supabase auth client to
 * hang on initialization and token refresh.
 *
 * Primary path uses navigator.locks with bounded retries. When Web Locks
 * are unavailable, we fall back to an in-memory FIFO queue in this tab,
 * still enforcing a timeout. We never execute callback paths unlocked.
 *
 * @see https://github.com/supabase/supabase-js/issues/1594
 */
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_INTERVAL_MS = 150;
let fallbackLockChain: Promise<void> = Promise.resolve();

/** Awaits a promise with timeout, throwing AbortError on deadline. */
async function awaitWithTimeout(
  promise: Promise<void>,
  timeoutMs: number
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new DOMException("Timed out waiting for auth lock", "AbortError"));
    }, timeoutMs);
  });

  try {
    await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/** Acquire an auth lock (Web Lock or in-memory fallback). */
async function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    const timeoutMs =
      acquireTimeout > 0
        ? Math.min(acquireTimeout, LOCK_TIMEOUT_MS)
        : LOCK_TIMEOUT_MS;

    let releaseCurrentLock = () => {};
    const currentLock = new Promise<void>((resolve) => {
      releaseCurrentLock = () => resolve();
    });

    const previousLock = fallbackLockChain;
    fallbackLockChain = previousLock.finally(() => currentLock);

    try {
      await awaitWithTimeout(previousLock, timeoutMs);
    } catch (error) {
      // Remove our queued slot so later callers can continue.
      releaseCurrentLock();
      throw error;
    }

    try {
      return await fn();
    } finally {
      releaseCurrentLock();
    }
  }

  const timeoutMs =
    acquireTimeout > 0
      ? Math.min(acquireTimeout, LOCK_TIMEOUT_MS)
      : LOCK_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    let acquired = false;
    let value: R | undefined;

    await navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
      if (!lock) {
        return;
      }
      acquired = true;
      value = await fn();
    });

    if (acquired) {
      return value as R;
    }

    await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_INTERVAL_MS));
  }

  throw new DOMException("Timed out waiting for auth lock", "AbortError");
}

/**
 * Creates or returns the existing Supabase browser client instance.
 * Uses a module-level singleton to reuse one client instance per loaded
 * module context.
 *
 * SECURITY NOTES:
 * - This client uses the publishable key only (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, sb_publishable_*)
 * - This client relies on currently configured Row Level Security (RLS) policies
 * - For mutations (insert, update, delete), prefer using server actions when possible
 * - Server actions provide additional validation and authorization checks
 * - Direct client mutations are acceptable when RLS policies are properly configured
 *
 * RESILIENCE NOTES:
 * - Uses a custom fetch wrapper with a 15-second timeout to prevent indefinite
 *   hangs on flaky networks (VPN, Private Relay, mobile Safari)
 * - detectSessionInUrl is disabled because auth completion is callback-route based
 *   (`/auth/callback` with code/token_hash), not hash-fragment token consumption
 *
 * @returns The Supabase client instance
 */
export function createBrowserClient(): SupabaseClient<DatabaseSchema> {
  // Return existing client if available (singleton pattern)
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getClientSupabaseUrl();
  const supabaseKey = getClientSupabaseKey();

  browserClient = createSSRBrowserClient<DatabaseSchema, "public">(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: browserFetchWithTimeout,
      },
      auth: {
        // Auth is completed via callback routes using query parameters.
        // Keep hash-fragment session detection disabled to avoid accepting
        // non-state-bound token fragments on arbitrary routes.
        detectSessionInUrl: false,
        // Prevent navigator.locks deadlocks on Safari iOS and Android Chrome.
        // The default lock uses infinite timeouts which can hang permanently
        // when tabs are suspended/resumed.
        lock: lockWithTimeout,
      },
    }
  );
  return browserClient;
}
