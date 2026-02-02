"use server";

import "server-only";

import { z } from "zod";

import { logAuthEvent } from "@/lib/auth-logger";
import { validateCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import type { UserPasskeyParams } from "@/lib/types";

/** Response type for encryption-related server actions */
export type EncryptionActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

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
 * - Input is validated using Zod schema to prevent malformed or malicious data
 * - Optional CSRF token validation for additional security
 * - Requires authenticated user
 *
 * @param params - The passkey parameters object
 * @param params.prf_salt - Base64-encoded PRF salt for HKDF
 * @param params.credential_id - Base64url-encoded credential ID
 * @param params.version - PRF version number
 * @param csrfToken - Optional CSRF token for additional security
 */
export async function savePasskeyParams(
  params: {
    prf_salt: string;
    credential_id: string;
    version: number;
  },
  csrfToken?: string
): Promise<EncryptionActionResponse> {
  try {
    // Validate CSRF token if provided
    if (csrfToken) {
      const isValidCSRF = await validateCSRFToken(csrfToken);
      if (!isValidCSRF) {
        logAuthEvent("csrf_validation_failed", {
          metadata: { action: "savePasskeyParams" },
        });
        return {
          success: false,
          error: "Security validation failed. Please refresh and try again.",
        };
      }
    }

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
