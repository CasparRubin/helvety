"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

import type { ActionResponse, UserAuthCredential } from "@/lib/types";

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
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
 * - Requires authenticated user
 *
 * @param credentialId - The credential ID to delete
 */
export async function deleteCredential(
  credentialId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
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
