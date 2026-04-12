import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { urls } from "@helvety/shared/config";
import { generateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { checkRateLimit, RATE_LIMITS } from "@helvety/shared/rate-limit";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { createServerClient } from "@helvety/shared/supabase/server";
import { NextResponse } from "next/server";

import { checkUserPasskeyStatus } from "@/app/actions/auth-action-helpers";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";
import { resolveAuthStep } from "@/lib/auth-step";

import type { EmailOtpType } from "@supabase/supabase-js";

const ALLOWED_OTP_TYPES = new Set<string>([
  "magiclink",
  "signup",
  "recovery",
  "invite",
  "email_change",
]);

/** Builds a login redirect URL with optional error and original redirect target. */
function buildErrorRedirect(
  authBase: string,
  error?: string,
  redirectUri?: string | null
): string {
  const loginUrl = new URL(`${authBase}/login`);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  if (redirectUri) {
    loginUrl.searchParams.set("redirect_uri", redirectUri);
  }
  return loginUrl.toString();
}

/** Returns true when OTP type is accepted by this callback route. */
function isAllowedOtpType(type: string | null): type is EmailOtpType {
  return typeof type === "string" && ALLOWED_OTP_TYPES.has(type);
}

/** Resolves the post-session redirect URL after callback auth succeeds. */
async function buildPostAuthRedirect(
  authBase: string,
  safeRedirectUri: string | null,
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildErrorRedirect(authBase, "auth_failed", safeRedirectUri);
  }

  const [passkeyResult, encryptionResult] = await Promise.all([
    checkUserPasskeyStatus(user.id),
    hasEncryptionSetup(),
  ]);
  const hasPasskey = passkeyResult.success && passkeyResult.data?.hasPasskey;
  const hasEncryption = encryptionResult.success && encryptionResult.data;
  const step = resolveAuthStep({
    hasPasskey: Boolean(hasPasskey),
    hasEncryption: Boolean(hasEncryption),
  });

  const loginUrl = new URL(`${authBase}/login`);
  loginUrl.searchParams.set("step", step);
  if (safeRedirectUri) {
    loginUrl.searchParams.set("redirect_uri", safeRedirectUri);
  }
  return loginUrl.toString();
}

/** Enforces callback IP rate-limit and returns early redirect when blocked. */
async function enforceCallbackRateLimit(
  request: Request,
  authBase: string,
  safeRedirectUri: string | null
): Promise<NextResponse | null> {
  const clientIP = getTrustedClientIp(request.headers, {
    requireTrustedProxyInProduction: true,
  });
  if (!clientIP) {
    return NextResponse.redirect(
      buildErrorRedirect(authBase, "missing_client_ip", safeRedirectUri)
    );
  }

  const rateLimit = await checkRateLimit(
    `auth_callback:ip:${clientIP}`,
    RATE_LIMITS.AUTH_CALLBACK.maxRequests,
    RATE_LIMITS.AUTH_CALLBACK.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.redirect(
      buildErrorRedirect(authBase, "rate_limited", safeRedirectUri)
    );
  }

  return null;
}

/**
 * Auth callback route for handling Supabase email verification and OAuth
 *
 * This route is a compatibility path for non-primary email/OAuth callbacks.
 * The primary sign-in flow uses typed OTP codes followed by passkey setup/sign-in,
 * but this route is kept for:
 * - Account recovery, invite, and email change confirmation links
 * - OAuth flows
 *
 * NOTE: This route is NOT used for passkey sign-in. Passkey authentication
 * creates the session directly server-side in verifyPasskeyAuthentication()
 * and returns a redirect URL to the client without going through this callback.
 *
 * After successful email auth, checks if user has passkey and encryption:
 * - If no passkey: redirects to login with step=encryption-setup (new user flow)
 * - If has passkey but no encryption: redirects to login with step=encryption-setup
 * - If has passkey and encryption: redirects to passkey-signin step
 *
 * Supports redirect_uri query param for cross-app SSO flows.
 * Redirect URIs are validated against an allowlist to prevent open redirects.
 * Rate limited by IP to prevent auth callback abuse.
 */
export async function GET(request: Request) {
  const authBase = urls.auth;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const rawRedirectUri = searchParams.get("redirect_uri");

    // Validate redirect URI against allowlist (prevents open redirect attacks)
    const safeRedirectUri = getSafeRedirectUri(rawRedirectUri, null);

    // Validate OTP type early to avoid consuming callback rate-limit budget
    // with malformed requests.
    if (token_hash && type && !isAllowedOtpType(type)) {
      return NextResponse.redirect(
        buildErrorRedirect(authBase, "invalid_otp_type", safeRedirectUri)
      );
    }

    const rateLimitRedirect = await enforceCallbackRateLimit(
      request,
      authBase,
      safeRedirectUri
    );
    if (rateLimitRedirect) {
      return rateLimitRedirect;
    }

    // Handle PKCE flow (code exchange)
    if (code) {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        await generateCSRFToken();
        const redirectUrl = await buildPostAuthRedirect(
          authBase,
          safeRedirectUri,
          supabase
        );
        return NextResponse.redirect(redirectUrl);
      }

      logger.logUnexpectedError("Auth callback error (code exchange)", error);
      return NextResponse.redirect(
        buildErrorRedirect(authBase, "auth_failed", safeRedirectUri)
      );
    }

    // Handle token hash (email OTP verification link)
    if (token_hash && type) {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as EmailOtpType,
      });

      if (!error) {
        await generateCSRFToken();
        const redirectUrl = await buildPostAuthRedirect(
          authBase,
          safeRedirectUri,
          supabase
        );
        return NextResponse.redirect(redirectUrl);
      }

      logger.logUnexpectedError("Auth callback error (token hash)", error);
      return NextResponse.redirect(
        buildErrorRedirect(authBase, "auth_failed", safeRedirectUri)
      );
    }

    // No valid auth params (code or token_hash) for callback-based auth flow.
    return NextResponse.redirect(
      buildErrorRedirect(authBase, undefined, safeRedirectUri)
    );
  } catch (error) {
    logger.logUnexpectedError("Auth callback unexpected error", error);
    return NextResponse.redirect(buildErrorRedirect(authBase, "server_error"));
  }
}
