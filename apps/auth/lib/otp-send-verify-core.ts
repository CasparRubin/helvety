import "server-only";

import {
  AUTH_ACTIONS,
  AUTH_REASONS,
  logAuthEvent,
} from "@helvety/shared/auth-logger";
import { getSupabaseKey, getSupabaseUrl } from "@helvety/shared/env-validation";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { createClient } from "@supabase/supabase-js";

import { OTP_CODE_REGEX } from "@/lib/otp-code";
import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimit,
  checkEscalatingLockout,
  recordOtpFailureAndCheckLockout,
  resetEscalatingLockout,
} from "@/lib/rate-limit";

import { NormalizedEmailSchema } from "../app/actions/auth-action-helpers";
import { findUserByEmail } from "../app/actions/user-lookup";

import type { User } from "@helvety/shared/supabase-types";
import type { ActionResponse } from "@helvety/shared/types/entities";
import type { Session } from "@supabase/supabase-js";

/** Build a lockout key scoped to email + IP. */
export function getOtpLockoutKey(email: string, clientIP: string): string {
  return `${email.toLowerCase().trim()}:${clientIP}`;
}

/** Core OTP send logic (no CSRF); used by web server actions and extension routes. */
export async function sendOtpVerificationCodeCore(
  email: string,
  clientIP: string,
  options?: { nonEUEEAConfirmed?: boolean }
): Promise<ActionResponse<{ codeSent: boolean }>> {
  const emailParse = NormalizedEmailSchema.safeParse(email);
  if (!emailParse.success) {
    return { success: false, error: "Please enter a valid email address" };
  }
  const normalizedEmail = emailParse.data;

  const [emailRateLimit, ipRateLimit] = await Promise.all([
    checkRateLimit(
      `otp:email:${normalizedEmail}`,
      RATE_LIMITS.OTP.maxRequests,
      RATE_LIMITS.OTP.windowMs
    ),
    checkRateLimit(
      `otp:ip:${clientIP}`,
      RATE_LIMITS.OTP.maxRequests * 3,
      RATE_LIMITS.OTP.windowMs
    ),
  ]);

  if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
    const retryAfter =
      emailRateLimit.retryAfter ?? ipRateLimit.retryAfter ?? 60;
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: AUTH_ACTIONS.sendVerificationCode,
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

  logAuthEvent("login_started", {
    metadata: { method: "otp" },
    ip: clientIP,
  });

  try {
    const adminClient = createAdminClient();

    if (!options?.nonEUEEAConfirmed) {
      return {
        success: false,
        error:
          "Please confirm that you are not located in the EU/EEA to continue.",
      };
    }

    let isNewUser = false;
    const existingUser = await findUserByEmail(normalizedEmail, adminClient);

    if (!existingUser) {
      const { error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false,
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
          logger.logUnexpectedError("Error creating user", createError);
          return {
            success: true,
            data: { codeSent: true },
          };
        }
      }

      isNewUser = true;
    }

    const { error: signInError } = await adminClient.auth.signInWithOtp({
      email: normalizedEmail,
    });

    if (signInError) {
      logger.logUnexpectedError("Error sending verification code", signInError);
      logAuthEvent("otp_failed", {
        metadata: { reason: signInError.message },
        ip: clientIP,
      });
      return {
        success: true,
        data: { codeSent: true },
      };
    }

    logAuthEvent("otp_sent", {
      metadata: { isNewUser, method: "otp" },
      ip: clientIP,
    });

    return {
      success: true,
      data: { codeSent: true },
    };
  } catch (error) {
    logger.logUnexpectedError("Error in sendOtpVerificationCodeCore", error);
    logAuthEvent("otp_failed", {
      metadata: { reason: AUTH_REASONS.unexpectedError },
      ip: clientIP,
    });
    return {
      success: true,
      data: { codeSent: true },
    };
  }
}

/** Session tokens returned to the Chromium extension after OTP verify. */
export type OtpVerifySessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
  user: User;
};

/** Core OTP verify logic returning a session payload (no cookies / device trust). */
export async function verifyOtpCodeCore(
  email: string,
  code: string,
  clientIP: string
): Promise<ActionResponse<OtpVerifySessionPayload>> {
  const emailParse = NormalizedEmailSchema.safeParse(email);
  if (!emailParse.success) {
    return { success: false, error: "Please enter a valid email address" };
  }
  const normalizedEmail = emailParse.data;
  const otpLockoutKey = getOtpLockoutKey(normalizedEmail, clientIP);

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
    if (!OTP_CODE_REGEX.test(code)) {
      return {
        success: false,
        error: "Please enter a valid verification code",
      };
    }

    const supabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: "email",
    });

    if (verifyError || !data.user || !data.session) {
      logAuthEvent("login_failed", {
        metadata: {
          method: "otp",
          reason: verifyError?.message ?? AUTH_REASONS.noUser,
        },
        ip: clientIP,
      });

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
      userId: data.user.id,
      metadata: {
        method: "otp",
        client: "extension",
      },
      ip: clientIP,
    });

    const session: Session = data.session;
    return {
      success: true,
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? null,
        user: data.user,
      },
    };
  } catch (error) {
    logger.logUnexpectedError("Error in verifyOtpCodeCore", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
