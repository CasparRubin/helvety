"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";
import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

export type { UserPasskeyParams } from "@helvety/shared/types/entities";

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Strict validation for passkey PRF parameters.
 * Prevents oversized, malformed, or injection-prone values from reaching the DB.
 */
const SavePasskeyParamsSchema = z.object({
  /** Base64-encoded PRF salt (32 bytes = 44 base64 chars with padding) */
  prf_salt: z
    .string()
    .min(1, "PRF salt is required")
    .max(100, "PRF salt too long")
    .regex(/^[A-Za-z0-9+/]+=*$/, "PRF salt must be valid base64"),
  /** Base64url-encoded credential ID from WebAuthn */
  credential_id: z
    .string()
    .min(1, "Credential ID is required")
    .max(512, "Credential ID too long"),
  /** PRF key derivation version number */
  version: z.number().int().min(1).max(10),
});

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
 * - CSRF token validation
 * - Requires authenticated user
 *
 * @param csrfToken - CSRF token for request validation
 * @param params - The passkey parameters object
 * @param params.prf_salt - Base64-encoded PRF salt for HKDF
 * @param params.credential_id - Base64url-encoded credential ID
 * @param params.version - PRF version number
 */
export async function savePasskeyParams(
  csrfToken: string,
  params: {
    prf_salt: string;
    credential_id: string;
    version: number;
  }
): Promise<ActionResponse> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  try {
    // Validate input format before any DB access
    const parseResult = SavePasskeyParamsSchema.safeParse(params);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message ?? "Invalid parameters";
      logger.warn("Invalid passkey params:", parseResult.error);
      return { success: false, error: errorMessage };
    }
    const validatedParams = parseResult.data;

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
        prf_salt: validatedParams.prf_salt,
        credential_id: validatedParams.credential_id,
        version: validatedParams.version,
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
      error: "Security validation failed. Please refresh and try again.",
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
