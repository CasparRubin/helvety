"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { getPasskeyParamsWithOptions } from "@helvety/shared/encryption-actions";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { fetchUserPasskeyParamsForUser } from "@helvety/shared/user-passkey-params-db";

import { RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

// =============================================================================
// ENCRYPTION (PRF PARAMS)
// =============================================================================
//
// Read helpers: `hasEncryptionSetup` uses `authenticateAndRateLimit` here with
// `CREDENTIAL_READ` (no CSRF). `getPasskeyParams` delegates to
// `@helvety/shared/encryption-actions` `getPasskeyParamsWithOptions` with the
// same auth rate-limit prefix. Mutations (`saveKeyCheckValue`) use
// `authenticateAndRateLimit` with CSRF plus `ENCRYPTION` limits.

/**
 * Check if user has encryption (PRF params) set up.
 *
 * Rate-limited as an authenticated read (`CREDENTIAL_READ`); not CSRF-protected.
 */
export async function hasEncryptionSetup(): Promise<ActionResponse<boolean>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "auth-encryption",
      readRateLimitConfig: RATE_LIMITS.CREDENTIAL_READ,
    });
    if (!auth.ok) {
      return auth.response;
    }
    const { user, supabase } = auth.ctx;

    const row = await fetchUserPasskeyParamsForUser(
      supabase,
      user.id,
      "Error checking encryption setup"
    );
    if (!row.ok) {
      return { success: false, error: "Failed to check encryption status" };
    }

    return { success: true, data: row.params !== null };
  } catch (error) {
    logger.logUnexpectedError("Error in hasEncryptionSetup", error);
    return { success: false, error: "Failed to check encryption status" };
  }
}

/**
 * Get user's PRF params for encryption.
 *
 * Rate-limited as an authenticated read (`CREDENTIAL_READ`); not CSRF-protected.
 */
export async function getPasskeyParams(): Promise<
  ActionResponse<UserPasskeyParams | null>
> {
  return getPasskeyParamsWithOptions({
    rateLimitPrefix: "auth-encryption",
    readRateLimitConfig: RATE_LIMITS.CREDENTIAL_READ,
    fetchLogContext: "Error getting PRF params",
    loadErrorMessage: "Failed to load encryption params",
  });
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
    if (
      !keyCheckValue ||
      typeof keyCheckValue !== "string" ||
      keyCheckValue.length > 4096
    ) {
      return { success: false, error: "Invalid key check value" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "encryption",
      rateLimitConfig: RATE_LIMITS.ENCRYPTION,
      requireDeviceTrust: false,
    });
    if (!auth.ok) {
      return auth.response;
    }
    const { user, supabase } = auth.ctx;

    const { error } = await supabase
      .from("user_passkey_params")
      .update({ key_check_value: keyCheckValue })
      .eq("user_id", user.id);

    if (error) {
      logger.logUnexpectedError("Error saving key check value", error);
      return { success: false, error: "Failed to save key check value" };
    }

    return { success: true };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in saveKeyCheckValue",
      error
    );
  }
}
