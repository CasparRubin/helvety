"use server";

import "server-only";

import { requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

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
 * Save a key check value (KCV) for the authenticated user's passkey params.
 *
 * Generated client-side after deriving the master key. Allows future unlock
 * attempts to detect if a wrong passkey (wrong key) was used.
 */
export async function saveKeyCheckValue(
  csrfToken: string,
  keyCheckValue: string
): Promise<ActionResponse> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please sign in again.",
    };
  }

  try {
    if (
      !keyCheckValue ||
      typeof keyCheckValue !== "string" ||
      keyCheckValue.length > 4096
    ) {
      return { success: false, error: "Invalid key check value" };
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const rl = await checkRateLimit(
      `encryption:user:${user.id}`,
      RATE_LIMITS.ENCRYPTION.maxRequests,
      RATE_LIMITS.ENCRYPTION.windowMs,
      "encryption"
    );
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many attempts. Please wait ${rl.retryAfter ?? 60} seconds before trying again.`,
      };
    }

    const { error } = await supabase
      .from("user_passkey_params")
      .update({ key_check_value: keyCheckValue })
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error saving key check value:", error);
      return { success: false, error: "Failed to save key check value" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in saveKeyCheckValue:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
