import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "../env-validation";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get the service role key from environment.
 * This key has full access to the database, bypassing RLS.
 */
function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. " +
        "This key is required for admin operations like creating sessions. " +
        "Add it to your .env.local file (never commit this key to git)."
    );
  }
  if (key.length < 40) {
    throw new Error(
      "SUPABASE_SECRET_KEY appears too short to be a valid service role key. " +
        "Ensure you are using the service_role key from Supabase Dashboard > Project Settings > API."
    );
  }
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (publishableKey && key === publishableKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY must not be the same as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Use the service_role key for SUPABASE_SECRET_KEY and the anon/public key for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return key;
}

/** Singleton instance of the Supabase admin client */
let adminClient: SupabaseClient | null = null;

/**
 * Creates or returns the existing Supabase admin client instance.
 * Uses a singleton pattern for efficiency.
 *
 * SECURITY NOTES:
 * - This client uses the SERVICE ROLE key which bypasses RLS
 * - ONLY use this for admin operations that require elevated privileges
 * - NEVER expose this client or its operations to the client
 * - Common use cases: creating sessions, looking up credentials by ID
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
