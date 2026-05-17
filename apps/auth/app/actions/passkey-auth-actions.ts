"use server";

import "server-only";

import {
  AUTH_ACTIONS,
  AUTH_REASONS,
  logAuthEvent,
} from "@helvety/shared/auth-logger";
import { urls } from "@helvety/shared/config";
import { generateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import {
  createAdminClient,
  createScopedAdminQuery,
  lookupCredentialByCredentialId,
} from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";
import {
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { z } from "zod";

import { RATE_LIMITS, resetRateLimit } from "@/lib/rate-limit";

import {
  getRpId,
  getExpectedOrigins,
  OriginUrlSchema,
  runRateLimitGuard,
  runAuthActionGuards,
  storeChallenge,
  getStoredChallenge,
  clearChallenge,
} from "./auth-action-helpers";
import {
  clearDeviceTrustCookie,
  getValidDeviceTrustCookie,
  setDeviceTrustCookie,
} from "./device-trust-cookie";
import { findUserByEmail } from "./user-lookup";

import type {
  ActionResponse,
  UserAuthCredential,
} from "@helvety/shared/types/entities";
import type {
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/** Passkey auth options payload returned to the client. */
type PasskeyAuthOptionsResponse = PublicKeyCredentialRequestOptionsJSON;

const PasskeyAuthResponseSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal("public-key"),
  response: z.object({
    clientDataJSON: z.string().min(1),
    authenticatorData: z.string().min(1),
    signature: z.string().min(1),
    userHandle: z.string().nullable().optional(),
  }),
});

/** Narrow server-validated authentication payload type. */
type PasskeyAuthResponse = z.infer<typeof PasskeyAuthResponseSchema>;

const authenticatorTransportValues = new Set<AuthenticatorTransportFuture>([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

/** Narrows stored transport strings to valid WebAuthn transport values. */
function toAuthenticatorTransports(
  transports: string[] | null | undefined
): AuthenticatorTransportFuture[] {
  return (transports ?? []).filter(
    (transport): transport is AuthenticatorTransportFuture =>
      authenticatorTransportValues.has(
        transport as AuthenticatorTransportFuture
      )
  );
}

const PasskeyCredentialIdSchema = z.object({
  id: z.string().min(1),
});

const PASSKEY_OPTIONS_GENERIC_ERROR =
  "Unable to start passkey authentication. Please try signing in with email.";
const PASSKEY_VERIFY_GENERIC_ERROR =
  "Passkey authentication failed. Please try again.";

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
 * @param authOptions - Optional { isMobile, expectedEmail, expectedUserId } to choose platform/hybrid and bind passkey to account (email-bound or trusted-device user-bound)
 * @returns Authentication options for WebAuthn
 */
export async function generatePasskeyAuthOptions(
  csrfToken: string,
  origin: string,
  redirectUri?: string,
  authOptions?: {
    isMobile?: boolean;
    expectedEmail?: string;
    expectedUserId?: string;
  }
): Promise<ActionResponse<PasskeyAuthOptionsResponse>> {
  const originParse = OriginUrlSchema.safeParse(origin);
  if (!originParse.success) {
    return {
      success: false,
      error: PASSKEY_OPTIONS_GENERIC_ERROR,
    };
  }
  const safeOrigin = originParse.data;

  const isMobile = authOptions?.isMobile === true;
  const normalizedExpectedEmail = authOptions?.expectedEmail
    ?.toLowerCase()
    .trim();
  const expectedUserId = authOptions?.expectedUserId;
  const guard = await runAuthActionGuards({ csrfToken });
  if (!guard.ok) return guard.response;
  const clientIP = guard.clientIP;
  if (!clientIP) {
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }
  const rateLimit = await runRateLimitGuard({
    key: `passkey_auth:ip:${clientIP}`,
    maxRequests: RATE_LIMITS.PASSKEY.maxRequests,
    windowMs: RATE_LIMITS.PASSKEY.windowMs,
  });
  if (!rateLimit.ok) {
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: AUTH_ACTIONS.generatePasskeyAuthOptions,
        retryAfter: rateLimit.retryAfter,
      },
      ip: clientIP,
    });
    return rateLimit.response;
  }

  logAuthEvent("passkey_auth_started", { ip: clientIP });

  try {
    const rpId = getRpId(safeOrigin);
    let expectedUserIdForChallenge: string | undefined;
    let allowCredentials: GenerateAuthenticationOptionsOpts["allowCredentials"] =
      [];
    if (normalizedExpectedEmail) {
      const user = await findUserByEmail(normalizedExpectedEmail);
      if (!user) {
        logAuthEvent("passkey_auth_failed", {
          metadata: { reason: AUTH_REASONS.expectedUserNotFound },
          ip: clientIP,
        });
        return {
          success: false,
          error: PASSKEY_OPTIONS_GENERIC_ERROR,
        };
      }

      expectedUserIdForChallenge = user.id;
      const scopedAdmin = createScopedAdminQuery(user.id);

      const { data: credentials, error: credentialsError } = await scopedAdmin
        .from("user_auth_credentials")
        .select("credential_id, transports");

      if (credentialsError || !credentials || credentials.length === 0) {
        logger.error("No passkey credentials found for expected user", {
          credentialsError,
          userId: user.id,
        });
        return {
          success: false,
          error: PASSKEY_OPTIONS_GENERIC_ERROR,
        };
      }

      allowCredentials = credentials.map(
        (item: { credential_id: string; transports: string[] | null }) => ({
          id: item.credential_id,
          transports: toAuthenticatorTransports(item.transports),
        })
      );
    } else if (expectedUserId) {
      // Trusted-device passkey-first path: bind allowCredentials to the trusted user
      // without requiring the user to re-enter email on this device.
      const userIdParse = z.string().uuid().safeParse(expectedUserId);
      if (!userIdParse.success) {
        return { success: false, error: PASSKEY_OPTIONS_GENERIC_ERROR };
      }
      expectedUserIdForChallenge = userIdParse.data;
      const scopedAdmin = createScopedAdminQuery(userIdParse.data);
      const { data: credentials, error: credentialsError } = await scopedAdmin
        .from("user_auth_credentials")
        .select("credential_id, transports");

      if (credentialsError || !credentials || credentials.length === 0) {
        return {
          success: false,
          error: PASSKEY_OPTIONS_GENERIC_ERROR,
        };
      }

      allowCredentials = credentials.map(
        (item: { credential_id: string; transports: string[] | null }) => ({
          id: item.credential_id,
          transports: toAuthenticatorTransports(item.transports),
        })
      );
    }

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: rpId,
      userVerification: "required",
      timeout: 60000,
      // Empty allowCredentials preserves discoverable-credential flow.
      // When expectedEmail is provided, credentials are strictly account-bound.
      allowCredentials,
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

    // Store challenge for verification, including expected account context
    // when login was initiated from a specific email.
    await storeChallenge({
      challenge: authOpts.challenge,
      redirectUri: safeRedirectUri,
      expectedUserId: expectedUserIdForChallenge,
      expectedEmail: normalizedExpectedEmail,
    });

    return { success: true, data: optionsWithHints };
  } catch (error) {
    logger.logUnexpectedError("Error generating authentication options", error);
    return {
      success: false,
      error: PASSKEY_OPTIONS_GENERIC_ERROR,
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
  response: PasskeyAuthResponse,
  origin: string
): Promise<
  ActionResponse<{
    redirectUrl: string;
    userId: string;
  }>
> {
  const originParse = OriginUrlSchema.safeParse(origin);
  if (!originParse.success) {
    return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
  }
  const safeOrigin = originParse.data;

  const guard = await runAuthActionGuards({ csrfToken });
  if (!guard.ok) return guard.response;
  const clientIP = guard.clientIP;
  if (!clientIP) {
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }

  // Rate limit by IP to prevent brute force verification attempts
  const rateLimit = await runRateLimitGuard({
    key: `passkey_verify:ip:${clientIP}`,
    maxRequests: RATE_LIMITS.PASSKEY.maxRequests,
    windowMs: RATE_LIMITS.PASSKEY.windowMs,
  });
  if (!rateLimit.ok) {
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: AUTH_ACTIONS.verifyPasskeyAuthentication,
        retryAfter: rateLimit.retryAfter,
      },
      ip: clientIP,
    });
    return rateLimit.response;
  }

  try {
    const idParseResult = PasskeyCredentialIdSchema.safeParse(response);
    if (!idParseResult.success) {
      return {
        success: false,
        error: "Invalid passkey authentication payload",
      };
    }
    const credentialId = idParseResult.data.id;

    // Retrieve stored challenge
    const storedData = await getStoredChallenge();
    if (!storedData) {
      logAuthEvent("passkey_auth_failed", {
        metadata: { reason: AUTH_REASONS.challengeExpired },
        ip: clientIP,
      });
      return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
    }

    // One challenge must be single-use: clear it after the first verification attempt
    // regardless of success/failure to prevent replay within challenge TTL.
    try {
      const rpId = getRpId(safeOrigin);
      const expectedOrigins = getExpectedOrigins(rpId);

      const { data: credentialData, error: credError } =
        await lookupCredentialByCredentialId(credentialId);

      const adminClient = createAdminClient();

      if (credError || !credentialData) {
        logger.logUnexpectedError("Credential not found", credError);
        logAuthEvent("passkey_auth_failed", {
          metadata: { reason: AUTH_REASONS.credentialNotFound },
          ip: clientIP,
        });
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      const credential: UserAuthCredential = {
        ...credentialData,
        backed_up: credentialData.backed_up ?? false,
        transports: credentialData.transports ?? [],
      };

      if (
        storedData.expectedUserId &&
        credential.user_id !== storedData.expectedUserId
      ) {
        logAuthEvent("passkey_auth_failed", {
          userId: credential.user_id,
          metadata: { reason: AUTH_REASONS.credentialOwnerMismatch },
          ip: clientIP,
        });
        return {
          success: false,
          error: "PASSKEY_ACCOUNT_MISMATCH",
        };
      }

      // Convert stored public key from base64url back to Uint8Array
      const publicKeyUint8 = new Uint8Array(
        Buffer.from(credential.public_key, "base64url")
      );

      const opts: VerifyAuthenticationResponseOpts = {
        response: (() => {
          const parseResult = PasskeyAuthResponseSchema.safeParse(response);
          if (!parseResult.success) {
            throw new Error("INVALID_AUTH_PAYLOAD");
          }
          const typedResponse: AuthenticationResponseJSON = {
            id: parseResult.data.id,
            rawId: parseResult.data.rawId,
            type: parseResult.data.type,
            response: {
              ...parseResult.data.response,
              userHandle: parseResult.data.response.userHandle ?? undefined,
            },
            clientExtensionResults: {},
          };
          return typedResponse;
        })(),
        expectedChallenge: storedData.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: rpId,
        credential: {
          id: credential.credential_id,
          publicKey: publicKeyUint8,
          counter: credential.counter,
          transports: toAuthenticatorTransports(credential.transports),
        },
        requireUserVerification: true,
      };

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse(opts);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "INVALID_AUTH_PAYLOAD"
        ) {
          return {
            success: false,
            error: "Invalid passkey authentication payload",
          };
        }
        logger.logUnexpectedError("Authentication verification failed", error);
        logAuthEvent("passkey_auth_failed", {
          userId: credential.user_id,
          metadata: { reason: AUTH_REASONS.verificationError },
          ip: clientIP,
        });
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      if (!verification.verified) {
        logAuthEvent("passkey_auth_failed", {
          userId: credential.user_id,
          metadata: { reason: AUTH_REASONS.verificationFailed },
          ip: clientIP,
        });
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      // Update the counter to prevent replay attacks
      // Security: Counter update is CRITICAL - if it fails, we must fail the
      // authentication to prevent replay attacks where the same authentication
      // response is used multiple times.
      const scopedAdmin = createScopedAdminQuery(credential.user_id);
      const { data: updatedCredential, error: updateError } = await scopedAdmin
        .from("user_auth_credentials")
        .update({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq("credential_id", credentialId)
        .eq("counter", credential.counter)
        .select("credential_id")
        .maybeSingle();

      if (updateError || !updatedCredential) {
        logger.logUnexpectedError(
          "Error updating counter (or concurrent counter change) - failing auth for security",
          updateError
        );
        return {
          success: false,
          error: PASSKEY_VERIFY_GENERIC_ERROR,
        };
      }

      // Get user email for generating auth token
      const { data: userData, error: userError } =
        await adminClient.auth.admin.getUserById(credential.user_id);

      if (userError || !userData.user) {
        logger.logUnexpectedError("Error getting user", userError);
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      if (!userData.user.email) {
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      if (
        storedData.expectedEmail &&
        userData.user.email.toLowerCase() !== storedData.expectedEmail
      ) {
        logAuthEvent("passkey_auth_failed", {
          userId: credential.user_id,
          metadata: { reason: AUTH_REASONS.credentialEmailMismatch },
          ip: clientIP,
        });
        return {
          success: false,
          error: "PASSKEY_ACCOUNT_MISMATCH",
        };
      }

      // Generate a one-time auth token and verify it server-side immediately.
      // Supabase exposes this via the "magiclink" link primitive, but users are
      // never redirected through a magic-link flow in the primary /auth UX.
      // This keeps the primary email + OTP + passkey UX (no magic-link redirect)
      // while creating the session directly in the same request path.
      const { data: linkData, error: linkError } =
        await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: userData.user.email,
        });

      if (linkError || !linkData.properties?.hashed_token) {
        logger.logUnexpectedError("Error generating auth link", linkError);
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      // Verify the auth token server-side to create the session immediately
      // This avoids the PKCE/hash fragment issue where tokens are lost on server redirect
      const supabase = await createServerClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: linkData.properties.verification_type as EmailOtpType,
      });

      if (verifyError) {
        logger.logUnexpectedError("Error verifying OTP", verifyError);
        return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
      }

      // Rotate CSRF token after authentication state change to prevent
      // session fixation attacks where an attacker pre-plants a known token
      await generateCSRFToken();

      // Reset rate limits on successful auth
      await Promise.all([
        resetRateLimit(`passkey_auth:ip:${clientIP}`),
        resetRateLimit(`passkey_verify:ip:${clientIP}`),
      ]);

      logAuthEvent("passkey_auth_success", {
        userId: credential.user_id,
        ip: clientIP,
      });

      // Return the redirect URL - session is already set via cookies
      // Re-validate stored redirectUri as defense-in-depth
      const redirectUrl =
        getSafeRedirectUri(storedData.redirectUri, urls.home) ?? urls.home;

      // Sliding device-trust renewal: renew only if an existing valid trust cookie
      // is present and matches the authenticated user. Never create trust on
      // passkey auth alone (trust is minted on email OTP verification).
      const existingTrust = await getValidDeviceTrustCookie();
      if (existingTrust) {
        if (existingTrust.userId === credential.user_id) {
          await setDeviceTrustCookie(credential.user_id);
        } else {
          await clearDeviceTrustCookie();
        }
      }

      return {
        success: true,
        data: {
          redirectUrl,
          userId: credential.user_id,
        },
      };
    } finally {
      try {
        await clearChallenge();
      } catch (clearError) {
        logger.warn("Failed to clear passkey auth challenge:", clearError);
      }
    }
  } catch (error) {
    logger.logUnexpectedError("Error verifying authentication", error);
    logAuthEvent("passkey_auth_failed", {
      metadata: { reason: AUTH_REASONS.unexpectedError },
      ip: clientIP,
    });
    return { success: false, error: PASSKEY_VERIFY_GENERIC_ERROR };
  }
}
