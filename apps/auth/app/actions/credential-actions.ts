"use server";

import "server-only";

import { requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UserAuthCredential,
} from "@helvety/shared/types/entities";

// =============================================================================
// CREDENTIAL MANAGEMENT
// =============================================================================

/**
 * Check whether the currently authenticated user has passkey credentials.
 *
 * This is the client-safe version: it requires a valid session and only returns
 * the authenticated user's own status, preventing user-enumeration attacks.
 * Server-internal code that needs to check arbitrary userIds should use the
 * helper in auth-action-helpers.ts instead.
 */
export async function getOwnPasskeyStatus(): Promise<
  ActionResponse<{ hasPasskey: boolean; count: number }>
> {
  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const rl = await checkRateLimit(
      `credential_read:user:${user.id}`,
      RATE_LIMITS.CREDENTIAL_READ.maxRequests,
      RATE_LIMITS.CREDENTIAL_READ.windowMs
    );
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please wait ${rl.retryAfter ?? 60} seconds before trying again.`,
      };
    }

    const { data, error, count } = await adminClient
      .from("user_auth_credentials")
      .select("id", { count: "exact" })
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error checking passkey status:", error);
      return { success: false, error: "Failed to check passkey status" };
    }

    const credentialCount = count ?? data?.length ?? 0;

    return {
      success: true,
      data: { hasPasskey: credentialCount > 0, count: credentialCount },
    };
  } catch (error) {
    logger.error("Error in getOwnPasskeyStatus:", error);
    return { success: false, error: "Failed to check passkey status" };
  }
}

/**
 * Get user's registered credentials (for management UI)
 * Requires authentication
 */
export async function getUserCredentials(): Promise<
  ActionResponse<UserAuthCredential[]>
> {
  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const rl = await checkRateLimit(
      `credential_read:user:${user.id}`,
      RATE_LIMITS.CREDENTIAL_READ.maxRequests,
      RATE_LIMITS.CREDENTIAL_READ.windowMs
    );
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please wait ${rl.retryAfter ?? 60} seconds before trying again.`,
      };
    }

    // Use adminClient to bypass deny-all RLS policy on user_auth_credentials
    const { data, error } = await adminClient
      .from("user_auth_credentials")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting credentials:", error);
      return { success: false, error: "Failed to get credentials" };
    }

    return { success: true, data: data as UserAuthCredential[] };
  } catch (error) {
    logger.error("Error getting user credentials:", error);
    return { success: false, error: "Failed to get credentials" };
  }
}

/**
 * Delete a credential (for management UI)
 *
 * Security:
 * - CSRF token validation
 * - Requires authenticated user
 *
 * @param csrfToken - CSRF token for request validation
 * @param credentialId - The credential ID to delete
 */
export async function deleteCredential(
  csrfToken: string,
  credentialId: string
): Promise<ActionResponse> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const rl = await checkRateLimit(
      `credential:user:${user.id}`,
      RATE_LIMITS.CREDENTIAL.maxRequests,
      RATE_LIMITS.CREDENTIAL.windowMs
    );
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please wait ${rl.retryAfter ?? 60} seconds before trying again.`,
      };
    }

    // Use adminClient to bypass deny-all RLS policy on user_auth_credentials
    const { error } = await adminClient
      .from("user_auth_credentials")
      .delete()
      .eq("user_id", user.id)
      .eq("credential_id", credentialId);

    if (error) {
      logger.error("Error deleting credential:", error);
      return { success: false, error: "Failed to delete credential" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Error deleting credential:", error);
    return { success: false, error: "Failed to delete credential" };
  }
}
