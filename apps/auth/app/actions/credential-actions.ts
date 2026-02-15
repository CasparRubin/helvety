"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

import { requireCSRFToken } from "@/lib/csrf";
import { createAdminClient } from "@/lib/supabase/admin";


import type { ActionResponse, UserAuthCredential } from "@helvety/shared/types/entities";

// =============================================================================
// CREDENTIAL MANAGEMENT
// =============================================================================

/**
 * Check if a user has any passkey credentials registered
 *
 * @param userId - The user's ID
 * @returns Whether the user has passkeys and the count
 */
export async function checkUserPasskeyStatus(
  userId: string
): Promise<ActionResponse<{ hasPasskey: boolean; count: number }>> {
  try {
    const adminClient = createAdminClient();

    const { data, error, count } = await adminClient
      .from("user_auth_credentials")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if (error) {
      logger.error("Error checking passkey status:", error);
      return { success: false, error: "Failed to check passkey status" };
    }

    const credentialCount = count ?? data?.length ?? 0;

    return {
      success: true,
      data: {
        hasPasskey: credentialCount > 0,
        count: credentialCount,
      },
    };
  } catch (error) {
    logger.error("Error in checkUserPasskeyStatus:", error);
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
