import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

import { getSupabaseUrl, getSupabaseKey } from "@/lib/env-validation";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton instance of the Supabase client for browser usage.
 * This prevents creating multiple client instances, improving performance.
 */
let browserClient: SupabaseClient | null = null;

/**
 * Timeout for fetch requests to the Supabase API (ms).
 * Prevents indefinite hangs on flaky networks (VPN, Private Relay, mobile).
 */
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch wrapper with timeout via AbortController.
 *
 * On unreliable networks (VPN, Private Relay, mobile on iOS), requests to
 * the Supabase Auth API can hang indefinitely. This wrapper ensures we
 * abort after FETCH_TIMEOUT_MS and surface the error promptly so retry
 * logic at higher layers can kick in.
 */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();

  // Respect any existing signal from the caller
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort());
  }

  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * Lock wrapper with timeout to prevent navigator.locks deadlocks.
 *
 * Safari iOS and some Android browsers can hold Web Locks indefinitely
 * when tabs are suspended/resumed, causing the Supabase auth client to
 * hang on initialization and token refresh.
 *
 * This wrapper aborts lock acquisition after LOCK_TIMEOUT_MS and falls
 * back to running the callback without a lock. The trade-off (potential
 * duplicate refresh requests across tabs) is vastly preferable to a
 * complete auth deadlock.
 *
 * @see https://github.com/supabase/supabase-js/issues/1594
 */
const LOCK_TIMEOUT_MS = 5_000;

/** Acquire a Web Lock with a timeout, falling back to no lock on timeout. */
async function lockWithTimeout<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return await fn();
  }

  const abort = new AbortController();
  const timer = setTimeout(
    () => abort.abort(),
    acquireTimeout > 0
      ? Math.min(acquireTimeout, LOCK_TIMEOUT_MS)
      : LOCK_TIMEOUT_MS
  );

  try {
    return await navigator.locks.request(
      name,
      { signal: abort.signal },
      async () => fn()
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Lock acquisition timed out - run without lock
      return await fn();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Creates or returns the existing Supabase browser client instance.
 * Uses a singleton pattern to ensure only one client instance exists per browser context.
 *
 * SECURITY NOTES:
 * - This client uses the anon/publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 * - All database operations are protected by Row Level Security (RLS) policies
 * - For mutations (insert, update, delete), prefer using server actions when possible
 * - Server actions provide additional validation and authorization checks
 * - Direct client mutations are acceptable when RLS policies are properly configured
 *
 * RESILIENCE NOTES:
 * - Uses a custom fetch wrapper with a 15-second timeout to prevent indefinite
 *   hangs on flaky networks (VPN, Private Relay, mobile Safari)
 * - detectSessionInUrl is disabled because AuthTokenHandler handles hash tokens
 *   explicitly, avoiding race conditions on initial page load
 *
 * @returns The Supabase client instance
 */
export function createBrowserClient(): SupabaseClient {
  // Return existing client if available (singleton pattern)
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  browserClient = createSSRBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      // AuthTokenHandler explicitly handles hash-fragment tokens in the root
      // layout, so we disable the built-in detection to avoid race conditions
      // where Supabase tries to consume the hash before our handler runs.
      detectSessionInUrl: false,
      // Prevent navigator.locks deadlocks on Safari iOS and Android Chrome.
      // The default lock uses infinite timeouts which can hang permanently
      // when tabs are suspended/resumed.
      lock: lockWithTimeout,
    },
  });
  return browserClient;
}
