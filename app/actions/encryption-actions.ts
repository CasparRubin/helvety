"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase/server";

import type { ActionResponse, UserPasskeyParams } from "@/lib/types";

export type { UserPasskeyParams } from "@/lib/types";

// =============================================================================
// ENCRYPTION (PRF PARAMS)
// =============================================================================

/**
 * Check if user has encryption (PRF params) set up
 */
export async function hasEncryptionSetup(): Promise<ActionResponse<boolean>> {
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
      .from("user_passkey_params")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // PGRST116 = no rows found (user hasn't set up encryption)
      if (error.code === "PGRST116") {
        return { success: true, data: false };
      }
      logger.error("Error checking encryption setup:", error);
      return { success: false, error: "Failed to check encryption status" };
    }

    return { success: true, data: !!data };
  } catch (error) {
    logger.error("Error in hasEncryptionSetup:", error);
    return { success: false, error: "Failed to check encryption status" };
  }
}

/**
 * Get user's PRF params for encryption
 */
export async function getPasskeyParams(): Promise<
  ActionResponse<UserPasskeyParams | null>
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
      .from("user_passkey_params")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // PGRST116 = no rows found
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      logger.error("Error getting PRF params:", error);
      return { success: false, error: "Failed to get encryption params" };
    }

    return { success: true, data: data as UserPasskeyParams };
  } catch (error) {
    logger.error("Error in getPasskeyParams:", error);
    return { success: false, error: "Failed to get encryption params" };
  }
}

/**
 * Save user's passkey encryption params (PRF salt and credential ID)
 * Used during encryption setup flow
 *
 * Security:
 * - Requires authenticated user
 *
 * @param params - The passkey parameters object
 * @param params.prf_salt - Base64-encoded PRF salt for HKDF
 * @param params.credential_id - Base64url-encoded credential ID
 * @param params.version - PRF version number
 */
export async function savePasskeyParams(params: {
  prf_salt: string;
  credential_id: string;
  version: number;
}): Promise<ActionResponse> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("user_passkey_params").upsert(
      {
        user_id: user.id,
        prf_salt: params.prf_salt,
        credential_id: params.credential_id,
        version: params.version,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      logger.error("Error saving PRF params:", error);
      return { success: false, error: "Failed to save encryption settings" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Error in savePasskeyParams:", error);
    return { success: false, error: "Failed to save encryption settings" };
  }
}
