"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { buildAuthRequiredError } from "@helvety/shared/auth-errors";
import { requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { createServerClient } from "@helvety/shared/supabase/server";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { fetchUserPasskeyParamsForUser } from "@helvety/shared/user-passkey-params-db";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

// =============================================================================
// ENCRYPTION (PRF PARAMS)
// =============================================================================
//
// Read helpers (`hasEncryptionSetup`, `getPasskeyParams`) use
// `authenticateAndRateLimit` with `readRateLimitConfig: CREDENTIAL_READ` (no
// CSRF). Mutations (`saveKeyCheckValue`) keep CSRF plus `ENCRYPTION` limits.

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
      "Error getting PRF params"
    );
    if (!row.ok) {
      return { success: false, error: "Failed to load encryption params" };
    }

    return { success: true, data: row.params };
  } catch (error) {
    logger.logUnexpectedError("Error in getPasskeyParams", error);
    return { success: false, error: "Failed to load encryption params" };
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
      return { success: false, error: buildAuthRequiredError() };
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
        error: buildRateLimitedUserMessage(rl.retryAfter),
      };
    }

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
