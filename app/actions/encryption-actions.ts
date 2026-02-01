"use server";

import "server-only";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/** Response type for encryption-related server actions */
export type EncryptionActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * User passkey params for encryption
 */
export interface UserPasskeyParams {
  user_id: string;
  prf_salt: string;
  credential_id: string;
  version: number;
  created_at: string;
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
