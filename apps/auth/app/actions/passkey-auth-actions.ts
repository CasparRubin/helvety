"use server";

import "server-only";

import { logAuthEvent } from "@helvety/shared/auth-logger";
import { logger } from "@helvety/shared/logger";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { createServerClient } from "@helvety/shared/supabase/server";
import {
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { requireCSRFToken } from "@/lib/csrf";
import { checkRateLimit, RATE_LIMITS, resetRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";


import {
  getClientIP,
  getRpId,
  getExpectedOrigins,
  storeChallenge,
  getStoredChallenge,
  clearChallenge,
} from "./auth-action-helpers";

import type { ActionResponse, UserAuthCredential } from "@helvety/shared/types/entities";
import type {
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// =============================================================================
// AUTHENTICATION (returning users)
// =============================================================================

/**
 * Generate passkey authentication options
 * Called when a user wants to sign in with a passkey
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent brute force attacks
 * - Logs all attempts for audit trail
 *
 * When isMobile is true, hints client-device (this device); otherwise hybrid (phone via QR).
 *
 * @param csrfToken - CSRF token for request validation
 * @param origin - The origin URL
 * @param redirectUri - Optional redirect URI to preserve through auth flow
 * @param options - Optional { isMobile } to choose platform vs hybrid flow
 * @returns Authentication options to pass to the WebAuthn API
 */
export async function generatePasskeyAuthOptions(
  csrfToken: string,
  origin: string,
  redirectUri?: string,
  authOptions?: { isMobile?: boolean }
): Promise<ActionResponse<PublicKeyCredentialRequestOptionsJSON>> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  const isMobile = authOptions?.isMobile === true;
  const clientIP = await getClientIP();

  // Rate limit by IP
  const rateLimit = await checkRateLimit(
    `passkey_auth:ip:${clientIP}`,
    RATE_LIMITS.PASSKEY.maxRequests,
    RATE_LIMITS.PASSKEY.windowMs
  );

  if (!rateLimit.allowed) {
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "generatePasskeyAuthOptions",
        retryAfter: rateLimit.retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many attempts. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
    };
  }

  logAuthEvent("passkey_auth_started", { ip: clientIP });

  try {
    const rpId = getRpId(origin);

    // For discoverable credentials (passkeys), we don't need to specify allowCredentials
    // The authenticator will discover which credentials are available
    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: rpId,
      userVerification: "required",
      timeout: 60000,
      // Empty allowCredentials means "discover credentials" (resident keys)
      allowCredentials: [],
    };

    const authOpts = await generateAuthOptions(opts);

    // Hints: mobile = this device; desktop = phone via QR (hybrid)
    const optionsWithHints = {
      ...authOpts,
      hints: (isMobile ? ["client-device"] : ["hybrid"]) as (
        | "hybrid"
        | "security-key"
        | "client-device"
      )[],
    };

    // Validate redirectUri against allowlist before storing (prevent open redirect)
    const safeRedirectUri = getSafeRedirectUri(redirectUri) ?? undefined;

    // Store challenge for verification (no userId yet - we don't know who's authenticating)
    await storeChallenge({
      challenge: authOpts.challenge,
      redirectUri: safeRedirectUri,
    });

    return { success: true, data: optionsWithHints };
  } catch (error) {
    logger.error("Error generating authentication options:", error);
    return {
      success: false,
      error: "Failed to generate authentication options",
    };
  }
}

/**
 * Verify passkey authentication and create a session
 * Called after the user completes the WebAuthn authentication ceremony
 *
 * After successful passkey verification, this generates and verifies an auth
 * token server-side to create the session immediately, then returns a redirect URL.
 *
 * Security:
 * - CSRF token validation
 * - Rate limited to prevent brute force attacks
 * - Counter updates are critical for replay attack prevention
 * - Logs all attempts for audit trail
 *
 * @param csrfToken - CSRF token for request validation
 * @param response - The authentication response from the browser
 * @param origin - The origin URL
 * @returns Success status with redirect URL to final destination
 */
export async function verifyPasskeyAuthentication(
  csrfToken: string,
  response: AuthenticationResponseJSON,
  origin: string
): Promise<
  ActionResponse<{
    redirectUrl: string;
    userId: string;
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

  const clientIP = await getClientIP();

  // Rate limit by IP to prevent brute force verification attempts
  const rateLimit = await checkRateLimit(
    `passkey_verify:ip:${clientIP}`,
    RATE_LIMITS.PASSKEY.maxRequests,
    RATE_LIMITS.PASSKEY.windowMs
  );

  if (!rateLimit.allowed) {
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: "verifyPasskeyAuthentication",
        retryAfter: rateLimit.retryAfter,
      },
      ip: clientIP,
    });
    return {
      success: false,
      error: `Too many attempts. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
    };
  }

  try {
    // Retrieve stored challenge
    const storedData = await getStoredChallenge();
    if (!storedData) {
      logAuthEvent("passkey_auth_failed", {
        metadata: { reason: "challenge_expired" },
        ip: clientIP,
      });
      return { success: false, error: "Challenge expired or not found" };
    }

    const rpId = getRpId(origin);
    const expectedOrigins = getExpectedOrigins(rpId);

    // Use admin client to look up the credential (before authentication)
    const adminClient = createAdminClient();

    // Find the credential by ID
    const { data: credentialData, error: credError } = await adminClient
      .from("user_auth_credentials")
      .select("*")
      .eq("credential_id", response.id)
      .single();

    if (credError || !credentialData) {
      logger.error("Credential not found:", credError);
      logAuthEvent("passkey_auth_failed", {
        metadata: { reason: "credential_not_found" },
        ip: clientIP,
      });
      return { success: false, error: "Credential not found" };
    }

    const credential = credentialData as UserAuthCredential;

    // Convert stored public key from base64url back to Uint8Array
    const publicKeyUint8 = new Uint8Array(
      Buffer.from(credential.public_key, "base64url")
    );

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: storedData.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyUint8,
        counter: credential.counter,
        transports: (credential.transports ||
          []) as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    };

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      logger.error("Authentication verification failed:", error);
      logAuthEvent("passkey_auth_failed", {
        userId: credential.user_id,
        metadata: { reason: "verification_error" },
        ip: clientIP,
      });
      return { success: false, error: "Authentication verification failed" };
    }

    if (!verification.verified) {
      logAuthEvent("passkey_auth_failed", {
        userId: credential.user_id,
        metadata: { reason: "verification_failed" },
        ip: clientIP,
      });
      return { success: false, error: "Authentication verification failed" };
    }

    // Update the counter to prevent replay attacks
    // Security: Counter update is CRITICAL - if it fails, we must fail the
    // authentication to prevent replay attacks where the same authentication
    // response is used multiple times.
    const { error: updateError } = await adminClient
      .from("user_auth_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", response.id);

    if (updateError) {
      logger.error(
        "Error updating counter - failing auth for security:",
        updateError
      );
      return {
        success: false,
        error: "Authentication failed - please try again",
      };
    }

    // Get user email for generating auth token
    const { data: userData, error: userError } =
      await adminClient.auth.admin.getUserById(credential.user_id);

    if (userError || !userData.user) {
      logger.error("Error getting user:", userError);
      return { success: false, error: "User not found" };
    }

    if (!userData.user.email) {
      return { success: false, error: "User has no email" };
    }

    // Generate an auth token for the user and verify it server-side immediately
    // This creates the session directly without requiring client navigation to Supabase
    // which would lose the session tokens in hash fragments during server redirect
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });

    if (linkError || !linkData.properties?.hashed_token) {
      logger.error("Error generating auth link:", linkError);
      return { success: false, error: "Failed to create session" };
    }

    // Verify the auth token server-side to create the session immediately
    // This avoids the PKCE/hash fragment issue where tokens are lost on server redirect
    const supabase = await createServerClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: linkData.properties.verification_type as EmailOtpType,
    });

    if (verifyError) {
      logger.error("Error verifying OTP:", verifyError);
      return { success: false, error: "Failed to create session" };
    }

    // Clear the challenge
    await clearChallenge();

    // Reset rate limits on successful auth
    await resetRateLimit(`passkey_auth:ip:${clientIP}`);
    await resetRateLimit(`passkey_verify:ip:${clientIP}`);

    logAuthEvent("passkey_auth_success", {
      userId: credential.user_id,
      ip: clientIP,
    });

    // Return the redirect URL - session is already set via cookies
    // Re-validate stored redirectUri as defense-in-depth
    const redirectUrl =
      getSafeRedirectUri(storedData.redirectUri, "https://helvety.com") ??
      "https://helvety.com";
    return {
      success: true,
      data: {
        redirectUrl,
        userId: credential.user_id,
      },
    };
  } catch (error) {
    logger.error("Error verifying authentication:", error);
    logAuthEvent("passkey_auth_failed", {
      metadata: { reason: "unexpected_error" },
      ip: clientIP,
    });
    return { success: false, error: "Failed to verify authentication" };
  }
}
