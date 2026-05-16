/**
 * Shared auth callback handler factory for helvety.com path-zoned Next.js apps (this monorepo).
 *
 * Encapsulates the standard Supabase code-exchange / OTP-verification flow
 * with IP-based rate limiting, safe redirect validation, and error handling.
 * This handler is used across surfaces (including `apps/auth`) with optional
 * app-specific overrides for post-auth routing.
 */

import { NextResponse } from "next/server";

import { getLoginUrl } from "./auth-redirect";
import { getTrustedClientIp } from "./client-ip";
import { generateCSRFToken } from "./csrf";
import { logger } from "./logger";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import {
  getSafeRelativePath,
  getSafeRedirectUri,
  isValidRelativePath,
} from "./redirect-validation";
import { createServerClient } from "./supabase/server";

import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_ALLOWED_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/** Narrows callback `type` query values to configured Supabase email OTP types. */
function isAllowedEmailOtpType(
  value: string,
  allowed: ReadonlySet<EmailOtpType>
): value is EmailOtpType {
  return allowed.has(value);
}

/** Optional overrides for callback behavior per app surface. */
type CreateAuthCallbackHandlerOptions = {
  allowedOtpTypes?: readonly EmailOtpType[];
  buildLoginUrl?: (redirectUri?: string) => string;
  onAuthSuccessRedirect?: (options: {
    origin: string;
    safeRedirectUri: string | null;
    supabase: SupabaseClient;
  }) => Promise<string>;
};

/**
 * Creates a GET route handler for the standard Supabase auth callback.
 *
 * Handles PKCE code exchange and email OTP token verification, with
 * IP-based rate limiting and safe redirect validation.
 */
export function createAuthCallbackHandler(
  options: CreateAuthCallbackHandlerOptions = {}
) {
  const {
    allowedOtpTypes = DEFAULT_ALLOWED_OTP_TYPES,
    buildLoginUrl = getLoginUrl,
    onAuthSuccessRedirect,
  } = options;
  const allowedOtpTypeSet = new Set<EmailOtpType>(allowedOtpTypes);

  return async function GET(request: Request) {
    const { origin } = new URL(request.url);
    let authErrorUrl = buildLoginUrl(origin);

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
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const rawRedirectUri = searchParams.get("redirect_uri");
      const rawNext = searchParams.get("next");
      const safeRedirectUri = getSafeRedirectUri(rawRedirectUri, null);
      authErrorUrl = buildLoginUrl(safeRedirectUri ?? origin);
      if (rawNext && !isValidRelativePath(rawNext)) {
        logger.warn("Auth callback rejected invalid next path", {
          next: rawNext,
        });
        return NextResponse.redirect(`${authErrorUrl}&error=invalid_next`);
      }
      const next = getSafeRelativePath(rawNext, "/");
      const successDestination = safeRedirectUri
        ? new URL(safeRedirectUri)
        : new URL(next, origin);

      if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
          await generateCSRFToken();
          const successRedirect = onAuthSuccessRedirect
            ? await onAuthSuccessRedirect({
                origin,
                safeRedirectUri,
                supabase,
              })
            : buildLoginUrl(successDestination.toString());
          return NextResponse.redirect(successRedirect);
        }

        logger.logUnexpectedError("Auth callback error (code exchange)", error);
        return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
      }

      if (tokenHash && type) {
        if (!isAllowedEmailOtpType(type, allowedOtpTypeSet)) {
          logger.warn("Auth callback rejected OTP type", { type });
          return NextResponse.redirect(
            `${authErrorUrl}&error=invalid_otp_type`
          );
        }

        const supabase = await createServerClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (!error) {
          await generateCSRFToken();
          const successRedirect = onAuthSuccessRedirect
            ? await onAuthSuccessRedirect({
                origin,
                safeRedirectUri,
                supabase,
              })
            : buildLoginUrl(successDestination.toString());
          return NextResponse.redirect(successRedirect);
        }

        logger.logUnexpectedError("Auth callback error (token hash)", error);
        return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
      }

      return NextResponse.redirect(`${authErrorUrl}&error=missing_params`);
    } catch (error) {
      logger.logUnexpectedError("Auth callback unexpected error", error);
      return NextResponse.redirect(`${authErrorUrl}&error=server_error`);
    }
  };
}
