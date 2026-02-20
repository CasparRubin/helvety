/**
 * Shared auth callback handler factory for sub-apps (store, pdf, tasks, contacts).
 *
 * Encapsulates the standard Supabase code-exchange / OTP-verification flow
 * with IP-based rate limiting, safe redirect validation, and error handling.
 * The auth app has its own callback with passkey/encryption logic and is not
 * included here.
 */

import { NextResponse } from "next/server";

import { getLoginUrl } from "./auth-redirect";
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
      const clientIP =
        request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";

      const rateLimit = await checkRateLimit(
        `auth_callback:ip:${clientIP}`,
        RATE_LIMITS.AUTH_CALLBACK.maxRequests,
        RATE_LIMITS.AUTH_CALLBACK.windowMs
      );

      if (!rateLimit.allowed) {
        return NextResponse.redirect(`${origin}/?error=rate_limited`);
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
          return NextResponse.redirect(new URL(next, origin));
        }

        logger.error("Auth callback error (code exchange):", error);
        return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
      }

      if (token_hash && type) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as EmailOtpType,
        });

        if (!error) {
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
