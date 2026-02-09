import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/env-validation";
import { logger } from "@/lib/logger";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get the service role key from environment
 * This key has full access to the database, bypassing RLS
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
  return key;
}

/**
 * Singleton instance of the Supabase admin client
 * Uses service role key for full database access (bypasses RLS)
 */
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
 *
 * @returns The Supabase admin client instance
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

// =============================================================================
// Account Suspension (Law Enforcement / Abuse Response)
// =============================================================================

/**
 * Suspend a user account by banning them via Supabase Auth admin API.
 * This prevents the user from authenticating and accessing any services.
 *
 * Use cases:
 * - Responding to a valid Swiss court order
 * - Account reported for abuse (after internal review)
 *
 * IMPORTANT: This is an irreversible admin action in practice.
 * The ban can be lifted by calling `unsuspendUser()`, but this should only
 * be done after careful review.
 *
 * @param userId - The UUID of the user to suspend
 * @param reason - Internal reason for suspension (logged, not exposed to user)
 * @returns True if suspension was successful, false otherwise
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<boolean> {
  try {
    const client = createAdminClient();
    const { error } = await client.auth.admin.updateUserById(userId, {
      ban_duration: "876600h", // ~100 years, effectively permanent
    });

    if (error) {
      logger.error("Failed to suspend user:", {
        userId,
        reason,
        error: error.message,
      });
      return false;
    }

    logger.error("User account suspended:", { userId, reason });
    return true;
  } catch (error) {
    logger.error("Unexpected error suspending user:", { userId, error });
    return false;
  }
}

/**
 * Lift a suspension on a user account.
 *
 * @param userId - The UUID of the user to unsuspend
 * @param reason - Internal reason for lifting suspension (logged)
 * @returns True if unsuspension was successful, false otherwise
 */
export async function unsuspendUser(
  userId: string,
  reason: string
): Promise<boolean> {
  try {
    const client = createAdminClient();
    const { error } = await client.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (error) {
      logger.error("Failed to unsuspend user:", {
        userId,
        reason,
        error: error.message,
      });
      return false;
    }

    logger.error("User account unsuspended:", { userId, reason });
    return true;
  } catch (error) {
    logger.error("Unexpected error unsuspending user:", { userId, error });
    return false;
  }
}
