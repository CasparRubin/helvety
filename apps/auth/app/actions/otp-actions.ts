"use server";

import "server-only";

import { logAuthEvent } from "@helvety/shared/auth-logger";
import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";
import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimit,
  checkEscalatingLockout,
  recordOtpFailureAndCheckLockout,
  resetEscalatingLockout,
} from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

import { getClientIP, checkUserPasskeyStatus } from "./auth-action-helpers";
import { hasEncryptionSetup } from "./encryption-actions";

import type { ActionResponse } from "@helvety/shared/types/entities";
import type { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Find a user by email using a direct database lookup via Postgres RPC.
 *
 * Uses the `get_auth_user_by_email` Postgres function to perform an O(1) index
 * lookup on `auth.users.email`. This replaces the previous approach of
 * paginating through all users via `listUsers()`, which was O(n) and loaded
 * all user data into server memory on every login attempt.
 *
 * PREREQUISITE: The following SQL must be run once in your Supabase project
 * (Dashboard → SQL Editor):
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(lookup_email text)
 * RETURNS TABLE(id uuid, email text)
 * LANGUAGE sql
 * SECURITY DEFINER
 * SET search_path = ''
 * AS $$
 *   SELECT id, email
 *   FROM auth.users
 *   WHERE lower(email) = lower(lookup_email)
 *   LIMIT 1;
 * $$;
 *
 * -- Restrict access to service_role only (prevents client-side abuse)
 * REVOKE EXECUTE ON FUNCTION public.get_auth_user_by_email(text) FROM PUBLIC;
 * REVOKE EXECUTE ON FUNCTION public.get_auth_user_by_email(text) FROM anon;
 * REVOKE EXECUTE ON FUNCTION public.get_auth_user_by_email(text) FROM authenticated;
 * GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(text) TO service_role;
 * ```
 */
async function findUserByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<{ id: string; email: string } | null> {
  const { data, error } = await adminClient.rpc("get_auth_user_by_email", {
    lookup_email: email,
  });

  if (error) {
    logger.error("Error looking up user by email via RPC:", error);
    return null;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const user = Array.isArray(data) ? data[0] : data;
  return { id: user.id, email: user.email ?? email };
}

// =============================================================================
// EMAIL + OTP CODE AUTHENTICATION
// =============================================================================

/**
 * Check if an email address belongs to an existing user (read-only).
 *
 * This action performs NO writes. It only checks existence and passkey status.
 * Used as the first step of the auth flow so we can branch new vs returning
 * users BEFORE creating any database records (critical for geo-restriction
 * compliance: no EU user data may be stored before confirmation).
 *
 * When the user has a passkey, also returns their PRF salt and version so the
 * client can cache them before the passkey ceremony. This enables single-touch
 * login + encryption unlock even on new devices where localStorage is empty.
 * The PRF salt is NOT sensitive -- it's a public parameter stored in the
 * database; security comes from the passkey's private key, not the salt.
 *
 * Security:
 * - Rate limited to prevent enumeration attacks
 * - Email is normalized to prevent duplicates
 * - Does not expose direct user existence in the response
 * - Returns generic responses on errors to prevent enumeration
 *
 * @param email - The user's email address
 * @returns Whether this identity can use direct passkey sign-in, plus PRF params if available
 */
export async function checkEmail(
  email: string
): Promise<
  ActionResponse<{ hasPasskey: boolean; prfSalt?: string; prfVersion?: number }>
> {
  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = await getClientIP();

  // Rate limit by email AND IP to prevent enumeration
  const emailRateLimit = await checkRateLimit(
    `check:email:${normalizedEmail}`,
    RATE_LIMITS.OTP.maxRequests,
    RATE_LIMITS.OTP.windowMs
  );
  const ipRateLimit = await checkRateLimit(
    `check:ip:${clientIP}`,
    RATE_LIMITS.OTP.maxRequests * 3,
    RATE_LIMITS.OTP.windowMs
  );

  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter =
      emailRateLimit.retryAfter ?? ipRateLimit.retryAfter ?? 60;
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "checkEmail",
        email: `${normalizedEmail.slice(0, 3)}***`,
        retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many attempts. Please wait ${retryAfter} seconds before trying again.`,
    };
  }

  try {
    const adminClient = createAdminClient();

    // Validate email format
    if (!z.string().email().safeParse(normalizedEmail).success) {
      return { success: false, error: "Please enter a valid email address" };
    }

    // Check if user exists (read-only, direct O(1) lookup via RPC)
    const existingUser = await findUserByEmail(adminClient, normalizedEmail);

    if (!existingUser) {
      return {
        success: true,
        data: { hasPasskey: false },
      };
    }

    // User exists, check passkey status
    const passkeyStatus = await checkUserPasskeyStatus(existingUser.id);
    const hasPasskey =
      passkeyStatus.success && (passkeyStatus.data?.hasPasskey ?? false);

    if (!hasPasskey) {
      return {
        success: true,
        data: { hasPasskey: false },
      };
    }

    // Fetch PRF params so the client can include PRF in the passkey ceremony.
    // This enables single-touch login + encryption unlock on any device.
    try {
      const { data: prfData, error: prfError } = await adminClient
        .from("user_passkey_params")
        .select("prf_salt, version")
        .eq("user_id", existingUser.id)
        .single();

      if (!prfError && prfData) {
        return {
          success: true,
          data: {
            hasPasskey: true,
            prfSalt: prfData.prf_salt,
            prfVersion: prfData.version,
          },
        };
      }
    } catch (prfFetchError) {
      // Non-fatal: PRF params fetch failed, but passkey sign-in still works.
      // The user will just need a separate encryption unlock step.
      logger.warn(
        "Failed to fetch PRF params during checkEmail:",
        prfFetchError
      );
    }

    return {
      success: true,
      data: { hasPasskey: true },
    };
  } catch (error) {
    logger.error("Error in checkEmail:", error);
    return {
      success: true,
      data: { hasPasskey: false },
    };
  }
}

/**
 * Send a verification code (OTP) to the user's email for authentication.
 * Creates a new account if the user doesn't exist, but ONLY when
 * `options.geoConfirmed` is true (the user has confirmed they are located
 * in Switzerland and are not an EU/EEA resident).
 *
 * Skips sending email for existing users who already have passkeys registered
 * (they should use passkey sign-in directly instead).
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent email spam attacks
 * - Email is normalized to prevent duplicates
 * - New user creation gated behind geo confirmation (GDPR compliance)
 * - Logs all attempts for audit trail
 *
 * @param csrfToken - CSRF token for request validation
 * @param email - The user's email address
 * @param options - Optional flags; geoConfirmed must be true for new users
 * @returns Whether a code was sent or the user should use passkey sign-in
 */
export async function sendVerificationCode(
  csrfToken: string,
  email: string,
  options?: { geoConfirmed?: boolean }
): Promise<ActionResponse<{ codeSent: boolean; hasPasskey: boolean }>> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = await getClientIP();

  // Rate limit by email AND IP to prevent abuse
  const emailRateLimit = await checkRateLimit(
    `otp:email:${normalizedEmail}`,
    RATE_LIMITS.OTP.maxRequests,
    RATE_LIMITS.OTP.windowMs
  );
  const ipRateLimit = await checkRateLimit(
    `otp:ip:${clientIP}`,
    RATE_LIMITS.OTP.maxRequests * 3, // Allow more per IP (multiple users)
    RATE_LIMITS.OTP.windowMs
  );

  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter =
      emailRateLimit.retryAfter ?? ipRateLimit.retryAfter ?? 60;
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "sendVerificationCode",
        email: `${normalizedEmail.slice(0, 3)}***`,
        retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many attempts. Please wait ${retryAfter} seconds before trying again.`,
    };
  }

  logAuthEvent("login_started", {
    metadata: { method: "otp" },
    ip: clientIP,
  });

  try {
    const adminClient = createAdminClient();

    // Validate email format
    if (!z.string().email().safeParse(normalizedEmail).success) {
      return { success: false, error: "Please enter a valid email address" };
    }

    // Check if user exists (direct O(1) lookup via RPC)
    const existingUser = await findUserByEmail(adminClient, normalizedEmail);

    // If user exists, check if they have a passkey
    if (existingUser) {
      const passkeyStatus = await checkUserPasskeyStatus(existingUser.id);
      if (passkeyStatus.success && passkeyStatus.data?.hasPasskey) {
        // Existing user with passkey - skip email, direct to passkey sign-in
        logAuthEvent("login_started", {
          metadata: { method: "passkey_direct", hasPasskey: true },
          ip: clientIP,
        });
        return {
          success: true,
          data: { codeSent: false, hasPasskey: true },
        };
      }
    }

    // New user or existing user without passkey - send OTP code
    let isNewUser = false;

    if (!existingUser) {
      // GUARD: Require geo confirmation before creating any user record.
      // This ensures no EU/EEA user data is ever persisted in the database.
      if (!options?.geoConfirmed) {
        return {
          success: false,
          error: "GEO_CONFIRMATION_REQUIRED",
        };
      }

      // Create new user (only after geo confirmation)
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false, // Will be confirmed when they verify the OTP code
        app_metadata: {
          geo_ch_confirmed: true,
          geo_ch_confirmed_at: new Date().toISOString(),
        },
      });

      if (createError) {
        logger.error("Error creating user:", createError);
        // Return generic success to prevent enumeration
        return {
          success: true,
          data: { codeSent: true, hasPasskey: false },
        };
      }

      isNewUser = true;
    }

    // Send OTP email (no emailRedirectTo needed - user types the code)
    const { error: signInError } = await adminClient.auth.signInWithOtp({
      email: normalizedEmail,
    });

    if (signInError) {
      logger.error("Error sending verification code:", signInError);
      logAuthEvent("otp_failed", {
        metadata: { reason: signInError.message },
        ip: clientIP,
      });
      // Return generic success to prevent enumeration
      return {
        success: true,
        data: { codeSent: true, hasPasskey: false },
      };
    }

    // Log internally only
    logAuthEvent("otp_sent", {
      metadata: { isNewUser, method: "otp" },
      ip: clientIP,
    });

    return {
      success: true,
      data: { codeSent: true, hasPasskey: false },
    };
  } catch (error) {
    logger.error("Error in sendVerificationCode:", error);
    logAuthEvent("otp_failed", {
      metadata: { reason: "unexpected_error" },
      ip: clientIP,
    });
    // Return generic success to prevent enumeration
    return {
      success: true,
      data: { codeSent: true, hasPasskey: false },
    };
  }
}

/**
 * Verify an OTP code that was sent to the user's email.
 * Creates a session on success and determines the next authentication step.
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent brute force attacks
 * - Uses server Supabase client for proper session/cookie handling
 * - Logs all attempts for audit trail
 *
 * @param csrfToken - CSRF token for request validation
 * @param email - The user's email address
 * @param code - The OTP code from the email
 * @returns The next step the user needs to complete
 */
export async function verifyEmailCode(
  csrfToken: string,
  email: string,
  code: string
): Promise<
  ActionResponse<{
    nextStep: "encryption-setup" | "passkey-signin";
    userId: string;
    isNewUser: boolean;
  }>
> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = await getClientIP();

  // Check escalating lockout first (long-term cumulative failure counter)
  const lockout = await checkEscalatingLockout(normalizedEmail);
  if (!lockout.allowed) {
    const retryMinutes = Math.ceil((lockout.retryAfter ?? 300) / 60);
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "verifyEmailCode",
        email: `${normalizedEmail.slice(0, 3)}***`,
        reason: "escalating_lockout",
        retryMinutes,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Account temporarily locked due to too many failed attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
    };
  }

  // Rate limit by email AND IP to prevent brute force (short-term sliding window)
  const emailRateLimit = await checkRateLimit(
    `otp_verify:email:${normalizedEmail}`,
    RATE_LIMITS.OTP_VERIFY.maxRequests,
    RATE_LIMITS.OTP_VERIFY.windowMs
  );
  const ipRateLimit = await checkRateLimit(
    `otp_verify:ip:${clientIP}`,
    RATE_LIMITS.OTP_VERIFY.maxRequests * 3,
    RATE_LIMITS.OTP_VERIFY.windowMs
  );

  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter =
      emailRateLimit.retryAfter ?? ipRateLimit.retryAfter ?? 60;
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "verifyEmailCode",
        email: `${normalizedEmail.slice(0, 3)}***`,
        retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many attempts. Please wait ${retryAfter} seconds before trying again.`,
    };
  }

  try {
    // Validate code format (6-8 digits, depending on Supabase config)
    if (!/^\d{6,8}$/.test(code)) {
      return {
        success: false,
        error: "Please enter a valid verification code",
      };
    }

    // Use server client (not admin) so session cookies are properly set
    const supabase = await createServerClient();

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });

    if (verifyError || !data.user) {
      logAuthEvent("login_failed", {
        metadata: { method: "otp", reason: verifyError?.message ?? "no_user" },
        ip: clientIP,
      });

      // Record failure for escalating lockout (cumulative counter)
      const lockoutResult =
        await recordOtpFailureAndCheckLockout(normalizedEmail);
      if (!lockoutResult.allowed) {
        const retryMinutes = Math.ceil((lockoutResult.retryAfter ?? 300) / 60);
        return {
          success: false,
          error: `Account temporarily locked due to too many failed attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
        };
      }

      return {
        success: false,
        error: "Invalid or expired code. Please try again.",
      };
    }

    const user = data.user;

    // Reset rate limit and escalating lockout on successful verification
    await resetRateLimit(`otp_verify:email:${normalizedEmail}`);
    await resetRateLimit(`otp_verify:ip:${clientIP}`);
    await resetEscalatingLockout(normalizedEmail);

    logAuthEvent("login_success", {
      userId: user.id,
      metadata: { method: "otp" },
      ip: clientIP,
    });

    // Check passkey/encryption status to determine next step
    const passkeyResult = await checkUserPasskeyStatus(user.id);
    const hasPasskey = passkeyResult.success && passkeyResult.data?.hasPasskey;

    const encryptionResult = await hasEncryptionSetup();
    const hasEncryption = encryptionResult.success && encryptionResult.data;

    let nextStep: "encryption-setup" | "passkey-signin";
    if (!hasPasskey || !hasEncryption) {
      nextStep = "encryption-setup";
    } else {
      nextStep = "passkey-signin";
    }

    return {
      success: true,
      data: {
        nextStep,
        userId: user.id,
        isNewUser: !hasPasskey,
      },
    };
  } catch (error) {
    logger.error("Error in verifyEmailCode:", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
