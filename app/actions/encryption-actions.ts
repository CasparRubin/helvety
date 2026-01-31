"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import type { UserPasskeyParams } from "@/lib/types";

export type EncryptionActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// Passkey-based encryption (PRF)
// ============================================================================

/**
 * Save user's passkey encryption params (PRF salt and credential ID)
 *
 * @param params.prf_salt - Base64-encoded PRF salt for HKDF
 * @param params.credential_id - Base64url-encoded credential ID
 * @param params.version - PRF version number
 */
export async function savePasskeyParams(params: {
  prf_salt: string;
  credential_id: string;
  version: number;
}): Promise<EncryptionActionResponse> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Upsert passkey params (insert or update if exists)
    const { error } = await supabase.from("user_passkey_params").upsert(
      {
        user_id: user.id,
        prf_salt: params.prf_salt,
        credential_id: params.credential_id,
        version: params.version,
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      logger.error("Error saving passkey params:", error);
      return {
        success: false,
        error: "Failed to save passkey encryption settings",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in savePasskeyParams:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get user's passkey encryption params from the database
 * Returns null if user hasn't set up passkey encryption yet
 */
export async function getPasskeyParams(): Promise<
  EncryptionActionResponse<UserPasskeyParams | null>
> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get passkey params
    const { data, error } = await supabase
      .from("user_passkey_params")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // PGRST116 = no rows found (user hasn't set up passkey encryption)
      if (error.code === "PGRST116") {
        return { success: true, data: null };
      }
      logger.error("Error getting passkey params:", error);
      return {
        success: false,
        error: "Failed to get passkey encryption settings",
      };
    }

    return { success: true, data: data as UserPasskeyParams };
  } catch (error) {
    logger.error("Unexpected error in getPasskeyParams:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check if user has passkey encryption set up
 */
export async function hasPasskeyEncryptionSetup(): Promise<
  EncryptionActionResponse<boolean>
> {
  const result = await getPasskeyParams();
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data !== null };
}

/**
 * Get encryption params for a user
 * Only passkey-based encryption is supported
 */
export async function getEncryptionParams(): Promise<
  EncryptionActionResponse<{
    type: "passkey" | null;
    passkeyParams?: UserPasskeyParams;
  }>
> {
  try {
    const passkeyResult = await getPasskeyParams();
    if (passkeyResult.success && passkeyResult.data) {
      return {
        success: true,
        data: {
          type: "passkey",
          passkeyParams: passkeyResult.data,
        },
      };
    }

    // No encryption set up
    return {
      success: true,
      data: { type: null },
    };
  } catch (error) {
    logger.error("Unexpected error in getEncryptionParams:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
