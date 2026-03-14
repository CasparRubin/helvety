/**
 * Shared auth callback handler factory for sub-apps
 * (store, pdf, tasks, contacts, notes).
 *
 * Encapsulates the standard Supabase code-exchange / OTP-verification flow
 * with IP-based rate limiting, safe redirect validation, and error handling.
 * The auth app has its own callback with passkey/encryption logic and is not
 * included here.
 */

import { NextResponse } from "next/server";

import { getLoginUrl } from "./auth-redirect";
import { getTrustedClientIp } from "./client-ip";
import { generateCSRFToken } from "./csrf";
import { logger } from "./logger";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { getSafeRelativePath } from "./redirect-validation";
import { createServerClient } from "./supabase/server";

import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Creates a GET route handler for the standard Supabase auth callback.
 *
 * Handles PKCE code exchange and email OTP token verification, with
 * IP-based rate limiting and safe redirect validation.
 */
export function createAuthCallbackHandler() {
  return async function GET(request: Request) {
    const { origin } = new URL(request.url);
    const authErrorUrl = getLoginUrl(origin);

    try {
      const clientIP = getTrustedClientIp(request.headers, {
        requireTrustedProxyInProduction: true,
      });
      if (!clientIP) {
        return NextResponse.redirect(`${authErrorUrl}&error=missing_client_ip`);
      }

      const rateLimit = await checkRateLimit(
        `auth_callback:ip:${clientIP}`,
        RATE_LIMITS.AUTH_CALLBACK.maxRequests,
        RATE_LIMITS.AUTH_CALLBACK.windowMs,
        "auth",
        "strict"
      );

      if (!rateLimit.allowed) {
        return NextResponse.redirect(`${authErrorUrl}&error=rate_limited`);
      }

      const { searchParams } = new URL(request.url);
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const next = getSafeRelativePath(searchParams.get("next"), "/");

      if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
          await generateCSRFToken();
          return NextResponse.redirect(new URL(next, origin));
        }

        logger.error("Auth callback error (code exchange):", error);
        return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
      }

      if (token_hash && type) {
        const otpType: EmailOtpType[] = [
          "signup",
          "invite",
          "magiclink",
          "recovery",
          "email_change",
          "email",
        ];
        if (!otpType.includes(type as EmailOtpType)) {
          return NextResponse.redirect(
            `${authErrorUrl}&error=invalid_otp_type`
          );
        }

        const supabase = await createServerClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as EmailOtpType,
        });

        if (!error) {
          await generateCSRFToken();
          return NextResponse.redirect(new URL(next, origin));
        }

        logger.error("Auth callback error (token hash):", error);
        return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
      }

      return NextResponse.redirect(`${authErrorUrl}&error=missing_params`);
    } catch (error) {
      logger.error("Auth callback unexpected error:", error);
      return NextResponse.redirect(`${authErrorUrl}&error=server_error`);
    }
  };
}
