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
function getOtpLockoutKey(email: string, clientIP: string): string {
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

/** Shared OTP verify pre-checks: escalating lockout + sliding-window rate limits. */
export async function runOtpVerifyRateLimits(
  normalizedEmail: string,
  clientIP: string,
  action: (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS] = AUTH_ACTIONS.verifyEmailCode
): Promise<ActionResponse<null>> {
  const otpLockoutKey = getOtpLockoutKey(normalizedEmail, clientIP);

  const lockout = await checkEscalatingLockout(otpLockoutKey);
  if (!lockout.allowed) {
    const retryMinutes = Math.ceil((lockout.retryAfter ?? 300) / 60);
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action,
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
        action,
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

  return { success: true, data: null };
}

/** Minimal Supabase client surface required for OTP verification. */
type OtpVerifyClient = Pick<ReturnType<typeof createClient>, "auth">;

/** Verify OTP against a Supabase client (cookie-persisting or stateless). */
export async function verifyOtpWithSupabaseClient(
  supabase: OtpVerifyClient,
  input: {
    normalizedEmail: string;
    code: string;
    clientIP: string;
    loginSuccessMetadata?: Record<string, unknown>;
    skipLoginSuccessLog?: boolean;
  }
): Promise<ActionResponse<{ user: User; session: Session | null }>> {
  const {
    normalizedEmail,
    code,
    clientIP,
    loginSuccessMetadata,
    skipLoginSuccessLog = false,
  } = input;
  const otpLockoutKey = getOtpLockoutKey(normalizedEmail, clientIP);

  if (!OTP_CODE_REGEX.test(code)) {
    return {
      success: false,
      error: "Please enter a valid verification code",
    };
  }

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

    const lockoutResult = await recordOtpFailureAndCheckLockout(otpLockoutKey);
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

  if (!skipLoginSuccessLog) {
    logAuthEvent("login_success", {
      userId: data.user.id,
      metadata: {
        method: "otp",
        ...loginSuccessMetadata,
      },
      ip: clientIP,
    });
  }

  return {
    success: true,
    data: {
      user: data.user,
      session: data.session ?? null,
    },
  };
}

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

  const preCheck = await runOtpVerifyRateLimits(normalizedEmail, clientIP);
  if (!preCheck.success) {
    return preCheck;
  }

  if (!OTP_CODE_REGEX.test(code)) {
    return {
      success: false,
      error: "Please enter a valid verification code",
    };
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const verifyResult = await verifyOtpWithSupabaseClient(supabase, {
      normalizedEmail,
      code,
      clientIP,
      loginSuccessMetadata: { client: "extension" },
    });

    if (!verifyResult.success) {
      return verifyResult;
    }

    const { user, session } = verifyResult.data;
    if (!session) {
      return {
        success: false,
        error: "Invalid or expired code. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? null,
        user,
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
