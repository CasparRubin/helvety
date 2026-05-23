"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  buildAuthRequiredError,
  isAuthRequiredError,
  normalizeActionError,
} from "@helvety/shared/auth-errors";

import { unexpectedActionError } from "./server-action-primitives";
import { fetchUserPasskeyParamsForUser } from "./user-passkey-params-db";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

/** Rate limit thresholds for passkey param reads. */
type RateLimitThresholds = {
  maxRequests: number;
  windowMs: number;
};

/** Options for {@link getPasskeyParamsWithOptions} (auth vs E2EE rate-limit prefixes). */
export type GetPasskeyParamsOptions = {
  rateLimitPrefix: string;
  readRateLimitConfig?: RateLimitThresholds;
  fetchLogContext: string;
  loadErrorMessage: string;
};

/**
 * Load passkey encryption params for the authenticated user.
 * Shared by the auth zone and E2EE apps (different rate-limit prefixes).
 */
export async function getPasskeyParamsWithOptions(
  options: GetPasskeyParamsOptions
): Promise<ActionResponse<UserPasskeyParams | null>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: options.rateLimitPrefix,
      readRateLimitConfig: options.readRateLimitConfig,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const row = await fetchUserPasskeyParamsForUser(
      supabase,
      user.id,
      options.fetchLogContext
    );
    if (!row.ok) {
      return {
        success: false,
        error: options.loadErrorMessage,
      };
    }

    return { success: true, data: row.params };
  } catch (error) {
    return unexpectedActionError(
      `Unexpected error in getPasskeyParams (${options.rateLimitPrefix})`,
      error
    );
  }
}

/**
 * Get user's passkey encryption params from the database
 * Returns null if user hasn't set up passkey encryption yet
 */
export async function getPasskeyParams(): Promise<
  ActionResponse<UserPasskeyParams | null>
> {
  return getPasskeyParamsWithOptions({
    rateLimitPrefix: "encryption",
    fetchLogContext: "Error getting passkey params",
    loadErrorMessage: "Failed to load passkey encryption settings",
  });
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
    return unexpectedActionError(
      "Unexpected error in getEncryptionParams",
      error
    );
  }
}
