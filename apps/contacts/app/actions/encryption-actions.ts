"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import { authenticateAndRateLimit } from "@/lib/action-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";

import type { ActionResponse, UserPasskeyParams } from "@/lib/types";

// ============================================================================
// Input Validation Schemas
// ============================================================================

/**
 * Validation schema for passkey params
 * Security: Validates input to prevent malformed or malicious data
 */
const PasskeyParamsSchema = z.object({
  // Base64-encoded PRF salt (typically 32 bytes = ~44 chars in base64)
  prf_salt: z
    .string()
    .min(1, "PRF salt is required")
    .max(1024, "PRF salt too long")
    .regex(/^[A-Za-z0-9+/=]+$/, "PRF salt must be valid base64"),
  // Base64url-encoded credential ID (variable length, typically 32-64 bytes)
  credential_id: z
    .string()
    .min(1, "Credential ID is required")
    .max(1024, "Credential ID too long")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Credential ID must be valid base64url (no padding)"
    ),
  // Version number for the PRF key derivation
  version: z
    .number()
    .int("Version must be an integer")
    .positive("Version must be positive")
    .max(100, "Version number too large"),
});

// ============================================================================
// Passkey-based encryption (PRF)
// ============================================================================

/**
 * Save user's passkey encryption params (PRF salt and credential ID)
 *
 * Security:
 * - CSRF token validation required
 * - Input is validated using Zod schema to prevent malformed or malicious data
 * - Requires authenticated user
 *
 * @param params - The passkey parameters object
 * @param params.prf_salt - Base64-encoded PRF salt for HKDF
 * @param params.credential_id - Base64url-encoded credential ID
 * @param params.version - PRF version number
 * @param csrfToken - CSRF token for security validation
 */
export async function savePasskeyParams(
  params: {
    prf_salt: string;
    credential_id: string;
    version: number;
  },
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "encryption",
      rateLimitConfig: RATE_LIMITS.ENCRYPTION_UNLOCK,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Validate input parameters
    const validationResult = PasskeyParamsSchema.safeParse(params);
    if (!validationResult.success) {
      logger.warn("Invalid passkey params:", validationResult.error.format());
      return {
        success: false,
        error: "Invalid passkey parameters",
      };
    }
    const validatedParams = validationResult.data;

    // Upsert passkey params (insert or update if exists)
    const { error } = await supabase.from("user_passkey_params").upsert(
      {
        user_id: user.id,
        prf_salt: validatedParams.prf_salt,
        credential_id: validatedParams.credential_id,
        version: validatedParams.version,
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
 * Check if user has passkey encryption set up
 */
export async function hasPasskeyEncryptionSetup(): Promise<
  ActionResponse<boolean>
> {
  const result = await getPasskeyParams();
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data !== null };
}

/**
 * Save a key check value (KCV) for the authenticated user's passkey params.
 *
 * The KCV is generated client-side after the master key is derived and allows
 * future unlock attempts to detect if a wrong passkey (wrong key) was used.
 */
export async function saveKeyCheckValue(
  keyCheckValue: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "encryption",
      rateLimitConfig: RATE_LIMITS.ENCRYPTION_UNLOCK,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (
      !keyCheckValue ||
      typeof keyCheckValue !== "string" ||
      keyCheckValue.length > 4096
    ) {
      return { success: false, error: "Invalid key check value" };
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

/**
 * Verify that a passkey credential belongs to the current session user.
 *
 * Called during E2EE unlock to prevent a wrong passkey (from a different
 * account) from being used to derive an incorrect master key, which would
 * silently corrupt encrypted data.
 *
 * Security:
 * - Requires authenticated user (session)
 * - Looks up the credential in user_auth_credentials
 * - Rejects if the credential's user_id does not match the session user
 */
export async function verifyEncryptionPasskey(
  credentialId: string
): Promise<ActionResponse<{ verified: boolean }>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "encryption",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    if (!credentialId || typeof credentialId !== "string") {
      return { success: false, error: "Invalid credential ID" };
    }

    const { data, error } = await supabase
      .from("user_auth_credentials")
      .select("user_id")
      .eq("credential_id", credentialId)
      .single();

    if (error || !data) {
      logger.warn("Credential not found during E2EE unlock verification");
      return { success: false, error: "Credential not found" };
    }

    if (data.user_id !== user.id) {
      logger.warn(
        "E2EE unlock rejected: passkey credential belongs to a different user"
      );
      return {
        success: true,
        data: { verified: false },
      };
    }

    return { success: true, data: { verified: true } };
  } catch (error) {
    logger.error("Unexpected error in verifyEncryptionPasskey:", error);
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
      return {
        success: false,
        error: passkeyResult.error ?? "Failed to check encryption status",
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
