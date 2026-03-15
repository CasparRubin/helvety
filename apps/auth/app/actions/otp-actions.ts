"use server";

import "server-only";

import { logAuthEvent } from "@helvety/shared/auth-logger";
import { generateCSRFToken, requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";
import { z } from "zod";

import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimit,
  checkEscalatingLockout,
  recordOtpFailureAndCheckLockout,
  resetEscalatingLockout,
} from "@/lib/rate-limit";

import { getClientIP, checkUserPasskeyStatus } from "./auth-action-helpers";
import { hasEncryptionSetup } from "./encryption-actions";
import { findUserByEmail } from "./user-lookup";

import type { ActionResponse } from "@helvety/shared/types/entities";

// =============================================================================
// EMAIL + OTP CODE AUTHENTICATION
// =============================================================================

/**
 * Build a lockout key scoped to email + IP.
 * This reduces targeted account lockout abuse from unrelated client IPs.
 */
function getOtpLockoutKey(email: string, clientIP: string): string {
  return `${email.toLowerCase().trim()}:${clientIP}`;
}

/**
 * Send a verification code (OTP) to the user's email for authentication.
 * Creates a new account if the user doesn't exist and then sends OTP in the
 * same request. Existing users follow the same OTP path to keep the flow
 * consistent and avoid email enumeration signals.
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent email spam attacks
 * - Email is normalized to prevent duplicates
 * - New user creation happens only after location confirmation
 * - Logs all attempts for audit trail
 *
 * @param csrfToken - CSRF token for request validation
 * @param email - The user's email address
 * @param options - Step-1 confirmation flags
 * @returns Whether an OTP was queued/sent
 */
export async function sendVerificationCode(
  csrfToken: string,
  email: string,
  options?: { nonEUEEAConfirmed?: boolean }
): Promise<ActionResponse<{ codeSent: boolean }>> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please sign in again.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = await getClientIP();

  // Rate limit by email AND IP to prevent abuse
  const [emailRateLimit, ipRateLimit] = await Promise.all([
    checkRateLimit(
      `otp:email:${normalizedEmail}`,
      RATE_LIMITS.OTP.maxRequests,
      RATE_LIMITS.OTP.windowMs
    ),
    checkRateLimit(
      `otp:ip:${clientIP}`,
      RATE_LIMITS.OTP.maxRequests * 3, // Allow more per IP (multiple users)
      RATE_LIMITS.OTP.windowMs
    ),
  ]);

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
    // Validate email format
    if (!z.string().email().safeParse(normalizedEmail).success) {
      return { success: false, error: "Please enter a valid email address" };
    }

    const adminClient = createAdminClient();

    // Ensure step-1 location confirmation was completed in the same submit.
    if (!options?.nonEUEEAConfirmed) {
      return {
        success: false,
        error:
          "Please confirm that you are not located in the EU/EEA to continue.",
      };
    }

    // New user or existing user - always continue with OTP code.
    let isNewUser = false;
    const existingUser = await findUserByEmail(normalizedEmail, adminClient);

    if (!existingUser) {
      // Create user at OTP-send boundary for first-time sign-ins.
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false, // Verified when they confirm OTP code
        app_metadata: {
          non_eu_eea_confirmed: true,
          non_eu_eea_confirmed_at: new Date().toISOString(),
        },
      });

      if (createError) {
        const message = createError.message.toLowerCase();
        const alreadyExists =
          message.includes("already") || message.includes("exists");
        if (!alreadyExists) {
          logger.error("Error creating user:", createError);
          // Keep response generic to avoid account state disclosure.
          return {
            success: true,
            data: { codeSent: true },
          };
        }
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
        data: { codeSent: true },
      };
    }

    // Log internally only
    logAuthEvent("otp_sent", {
      metadata: { isNewUser, method: "otp" },
      ip: clientIP,
    });

    return {
      success: true,
      data: { codeSent: true },
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
      data: { codeSent: true },
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
      error: "Security validation failed. Please sign in again.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const clientIP = await getClientIP();
  const otpLockoutKey = getOtpLockoutKey(normalizedEmail, clientIP);

  // Check escalating lockout first (long-term cumulative failure counter)
  const lockout = await checkEscalatingLockout(otpLockoutKey);
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
  const [emailRateLimit, ipRateLimit] = await Promise.all([
    checkRateLimit(
      `otp_verify:email:${normalizedEmail}`,
      RATE_LIMITS.OTP_VERIFY.maxRequests,
      RATE_LIMITS.OTP_VERIFY.windowMs
    ),
    checkRateLimit(
      `otp_verify:ip:${clientIP}`,
      RATE_LIMITS.OTP_VERIFY.maxRequests * 3,
      RATE_LIMITS.OTP_VERIFY.windowMs
    ),
  ]);

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
        await recordOtpFailureAndCheckLockout(otpLockoutKey);
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

    // Rotate CSRF token after successful auth state change.
    await generateCSRFToken();

    // Reset rate limit and escalating lockout on successful verification
    await Promise.all([
      resetRateLimit(`otp_verify:email:${normalizedEmail}`),
      resetRateLimit(`otp_verify:ip:${clientIP}`),
      resetEscalatingLockout(otpLockoutKey),
    ]);

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
