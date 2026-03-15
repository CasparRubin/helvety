import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

import { getSupabaseUrl, getSupabaseKey } from "../env-validation";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton instance of the Supabase client for browser usage.
 * This prevents creating multiple client instances, improving performance.
 */
let browserClient: SupabaseClient<DatabaseSchema> | null = null;

/**
 * Timeout for fetch requests to the Supabase API (ms).
 * Prevents indefinite hangs on flaky networks (VPN, Private Relay, mobile).
 */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch wrapper with timeout via AbortController.
 *
 * On unreliable networks (VPN, Private Relay, mobile on iOS), requests to
 * the Supabase Auth API can hang indefinitely. This wrapper attempts to
 * abort after FETCH_TIMEOUT_MS and surface the error promptly so retry
 * logic at higher layers can kick in.
 */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();

  // Respect any existing signal from the caller
  const onCallerAbort = () => controller.abort();
  if (init?.signal) {
    init.signal.addEventListener("abort", onCallerAbort);
  }

  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    init?.signal?.removeEventListener("abort", onCallerAbort);
  });
}

/**
 * Lock wrapper with timeout to prevent navigator.locks deadlocks.
 *
 * Safari iOS and some Android browsers can hold Web Locks indefinitely
 * when tabs are suspended/resumed, causing the Supabase auth client to
 * hang on initialization and token refresh.
 *
 * This wrapper uses bounded, non-blocking lock retries. It never executes
 * the callback without a lock because unlocked refresh paths can trigger
 * refresh-token storms across tabs and apps.
 *
 * @see https://github.com/supabase/supabase-js/issues/1594
 */
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_INTERVAL_MS = 150;

/** Acquire a Web Lock with bounded retries; never run unlocked. */
async function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return await fn();
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
 * - This client uses the anon/publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
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

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  browserClient = createSSRBrowserClient<DatabaseSchema, "public">(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: fetchWithTimeout,
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
