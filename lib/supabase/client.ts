import { createBrowserClient } from "@supabase/ssr";

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
export function createClient(): SupabaseClient {
  // Return existing client if available (singleton pattern)
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      // AuthTokenHandler explicitly handles hash-fragment tokens in the root
      // layout, so we disable the built-in detection to avoid race conditions
      // where Supabase tries to consume the hash before our handler runs.
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}
