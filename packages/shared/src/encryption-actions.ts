"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  buildAuthRequiredError,
  isAuthRequiredError,
  normalizeActionError,
} from "@helvety/shared/auth-errors";
import { logger } from "@helvety/shared/logger";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

/**
 * Get user's passkey encryption params from the database
 * Returns null if user hasn't set up passkey encryption yet
 */
export async function getPasskeyParams(): Promise<
  ActionResponse<UserPasskeyParams | null>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "encryption",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Get passkey params
    const { data, error } = await supabase
      .from("user_passkey_params")
      .select("*")
      .eq("user_id", user.id)
      .returns<UserPasskeyParams[]>()
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

    return { success: true, data };
  } catch (error) {
    logger.error("Unexpected error in getPasskeyParams:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get encryption params for a user
 * Only passkey-based encryption is supported
 */
export async function getEncryptionParams(): Promise<
  ActionResponse<{
    type: "passkey" | null;
    passkeyParams?: UserPasskeyParams;
  }>
> {
  try {
    const passkeyResult = await getPasskeyParams();

    // Propagate errors (auth failure, rate limit, etc.) instead of
    // silently treating them as "no encryption set up"
    if (!passkeyResult.success) {
      const normalizedError = normalizeActionError(passkeyResult.error);
      if (isAuthRequiredError(passkeyResult.error)) {
        return {
          success: false,
          error: buildAuthRequiredError(normalizedError ?? "Not authenticated"),
        };
      }
      return {
        success: false,
        error: normalizedError ?? "Failed to check encryption status",
      };
    }

    if (passkeyResult.data) {
      return {
        success: true,
        data: {
          type: "passkey",
          passkeyParams: passkeyResult.data,
        },
      };
    }

    // Only reached when success=true but data=null
    // (user genuinely has no encryption set up)
    return {
      success: true,
      data: { type: null },
    };
  } catch (error) {
    logger.error("Unexpected error in getEncryptionParams:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
