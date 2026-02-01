import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseUrl, getSupabaseKey } from "@/lib/env-validation";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton instance of the Supabase client for browser usage.
 */
let browserClient: SupabaseClient | null = null;

/**
 * Creates or returns the existing Supabase browser client instance.
 * Uses a singleton pattern to ensure only one client instance exists per browser context.
 *
 * @returns The Supabase client instance
 */
export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
}
