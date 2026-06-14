"use server";

import "server-only";

import {
  AUTH_ACTIONS,
  AUTH_REASONS,
  logAuthEvent,
} from "@helvety/shared/auth-logger";
import { generateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createServerMutatingClient } from "@helvety/shared/supabase/server";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";

import { resolveAuthStep } from "@/lib/auth-step";
import { OTP_CODE_REGEX } from "@/lib/otp-code";
import {
  getOtpLockoutKey,
  sendOtpVerificationCodeCore,
} from "@/lib/otp-send-verify-core";
import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimit,
  checkEscalatingLockout,
  recordOtpFailureAndCheckLockout,
  resetEscalatingLockout,
} from "@/lib/rate-limit";

import {
  NormalizedEmailSchema,
  checkUserPasskeyStatus,
  runAuthActionGuards,
} from "./auth-action-helpers";
import { mintAndVerifyDeviceTrustCookie } from "./device-trust-cookie";
import { hasEncryptionSetup } from "./encryption-actions";

import type { RequiredAuthStep } from "@/lib/auth-step";
import type { ActionResponse } from "@helvety/shared/types/entities";

// =============================================================================
// EMAIL + OTP CODE AUTHENTICATION
// =============================================================================

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
  const emailParse = NormalizedEmailSchema.safeParse(email);
  if (!emailParse.success) {
    return { success: false, error: "Please enter a valid email address" };
  }
  const normalizedEmail = emailParse.data;

  const guard = await runAuthActionGuards({ csrfToken });
  if (!guard.ok) return guard.response;
  const clientIP = guard.clientIP;
  if (!clientIP) {
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }

  return sendOtpVerificationCodeCore(normalizedEmail, clientIP, options);
}

/**
 * Verify an OTP code that was sent to the user's email.
 * Creates a session on success and determines the next authentication step.
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent brute force attacks
 * - Uses `createServerMutatingClient` so session cookies persist correctly
 * - Logs all attempts for audit trail
 *
 * After `verifyOtp` succeeds, the user is authenticated. Failures in
 * post-verify work (device trust, rate-limit reset, passkey/encryption probes)
 * are logged but still return `{ success: true }` so the client does not show
 * a false failure toast. CSRF rotation runs in the same success path; when it
 * succeeds, `data.csrfToken` carries the new token for client sync (falls back
 * to the request token if rotation throws). Only invalid or expired codes and
 * pre-verify guard failures return `{ success: false }`.
 *
 * @param csrfToken - CSRF token for request validation
 * @param email - The user's email address
 * @param code - The OTP code from the email
 * @returns Next auth step, user id, new-user flag, rotated `csrfToken`, and whether
 * device trust was minted and read back successfully in this request
 */
export async function verifyEmailCode(
  csrfToken: string,
  email: string,
  code: string
): Promise<
  ActionResponse<{
    nextStep: RequiredAuthStep;
    userId: string;
    isNewUser: boolean;
    csrfToken: string;
    deviceTrustMinted: boolean;
  }>
> {
  const emailParse = NormalizedEmailSchema.safeParse(email);
  if (!emailParse.success) {
    return { success: false, error: "Please enter a valid email address" };
  }
  const normalizedEmail = emailParse.data;

  const guard = await runAuthActionGuards({ csrfToken });
  if (!guard.ok) return guard.response;
  const clientIP = guard.clientIP;
  if (!clientIP) {
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }
  const otpLockoutKey = getOtpLockoutKey(normalizedEmail, clientIP);

  // Check escalating lockout first (long-term cumulative failure counter)
  const lockout = await checkEscalatingLockout(otpLockoutKey);
  if (!lockout.allowed) {
    const retryMinutes = Math.ceil((lockout.retryAfter ?? 300) / 60);
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: AUTH_ACTIONS.verifyEmailCode,
        email: `${normalizedEmail.slice(0, 3)}***`,
        reason: AUTH_REASONS.escalatingLockout,
        retryMinutes,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many failed verification attempts from this network. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}, or switch networks/device.`,
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
        action: AUTH_ACTIONS.verifyEmailCode,
        email: `${normalizedEmail.slice(0, 3)}***`,
        retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: buildRateLimitedUserMessage(retryAfter),
    };
  }

  try {
    // Validate code format (must match Supabase email OTP length in otp-code.ts)
    if (!OTP_CODE_REGEX.test(code)) {
      return {
        success: false,
        error: "Please enter a valid verification code",
      };
    }

    // Use server client (not admin) so session cookies are properly set
    const supabase = await createServerMutatingClient();

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });

    if (verifyError || !data.user) {
      logAuthEvent("login_failed", {
        metadata: {
          method: "otp",
          reason: verifyError?.message ?? AUTH_REASONS.noUser,
        },
        ip: clientIP,
      });

      // Record failure for escalating lockout (cumulative counter)
      const lockoutResult =
        await recordOtpFailureAndCheckLockout(otpLockoutKey);
      if (!lockoutResult.allowed) {
        const retryMinutes = Math.ceil((lockoutResult.retryAfter ?? 300) / 60);
        return {
          success: false,
          error: `Too many failed verification attempts from this network. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}, or switch networks/device.`,
        };
      }

      return {
        success: false,
        error: "Invalid or expired code. Please try again.",
      };
    }

    const user = data.user;

    // Session is established; post-verify failures must not return success:false.

    // Rotate CSRF token after successful auth state change.
    let rotatedCsrfToken = csrfToken;
    try {
      rotatedCsrfToken = await generateCSRFToken();
    } catch (csrfError) {
      logger.logUnexpectedError(
        "Failed to rotate CSRF token after OTP verify",
        csrfError
      );
    }

    // Mint device trust after email verification (fresh weekly window). Sliding
    // renewal happens only on subsequent passkey sign-ins when a valid trust
    // cookie for this user already exists — passkey alone never mints trust.
    // This does not grant access by itself; it only allows passkey-first UX.
    let deviceTrustMinted = false;
    try {
      deviceTrustMinted = await mintAndVerifyDeviceTrustCookie(user.id);
      if (!deviceTrustMinted) {
        logger.logUnexpectedError(
          "Device trust cookie mint/read-back failed after OTP verify",
          new Error("helvety_device_trust not readable after set")
        );
      }
    } catch (trustError) {
      logger.logUnexpectedError(
        "Failed to set device trust cookie after OTP verify",
        trustError
      );
    }

    // Reset rate limit and escalating lockout on successful verification
    try {
      await Promise.all([
        resetRateLimit(`otp_verify:email:${normalizedEmail}`),
        resetRateLimit(`otp_verify:ip:${clientIP}`),
        resetEscalatingLockout(otpLockoutKey),
      ]);
    } catch (rlError) {
      logger.logUnexpectedError(
        "Failed to reset rate limits after OTP verify",
        rlError
      );
    }

    logAuthEvent("login_success", {
      userId: user.id,
      metadata: {
        method: "otp",
        deviceTrustMinted,
      },
      ip: clientIP,
    });

    let hasPasskey = false;
    let hasEncryption = false;
    try {
      const passkeyResult = await checkUserPasskeyStatus(user.id);
      hasPasskey = Boolean(
        passkeyResult.success && passkeyResult.data?.hasPasskey
      );
    } catch (probeError) {
      logger.logUnexpectedError(
        "Failed to check passkey status after OTP verify",
        probeError
      );
    }
    try {
      const encryptionResult = await hasEncryptionSetup();
      hasEncryption = Boolean(
        encryptionResult.success && encryptionResult.data
      );
    } catch (probeError) {
      logger.logUnexpectedError(
        "Failed to check encryption status after OTP verify",
        probeError
      );
    }

    const nextStep = resolveAuthStep({
      hasPasskey,
      hasEncryption,
    });

    return {
      success: true,
      data: {
        nextStep,
        userId: user.id,
        isNewUser: !hasPasskey,
        csrfToken: rotatedCsrfToken,
        deviceTrustMinted,
      },
    };
  } catch (error) {
    logger.logUnexpectedError("Error in verifyEmailCode", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
