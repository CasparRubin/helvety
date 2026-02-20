"use server";

import "server-only";

import { requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";
import {
  generateRegistrationOptions as generateRegOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import {
  RP_NAME,
  PRF_VERSION,
  generatePRFSalt,
  getRpId,
  getExpectedOrigins,
  storeChallenge,
  getStoredChallenge,
  clearChallenge,
} from "./auth-action-helpers";

import type { ActionResponse } from "@helvety/shared/types/entities";
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// =============================================================================
// PASSKEY REGISTRATION (for authenticated users)
// =============================================================================

/**
 * Generate passkey registration options for an authenticated user
 * Called when a user wants to add a new passkey to their existing account
 *
 * This includes PRF extension for E2EE encryption key derivation.
 * When isMobile is true, uses platform authenticator (this device); otherwise
 * uses cross-platform/hybrid (phone via QR) for desktop.
 *
 * Security:
 * - CSRF token validation
 * - Requires authenticated user
 *
 * @param csrfToken - CSRF token for request validation
 * @param origin - The origin URL (e.g., 'https://helvety.com/auth')
 * @param options - Optional { isMobile } to choose platform vs hybrid flow
 * @returns Registration options to pass to the WebAuthn API
 */
export async function generatePasskeyRegistrationOptions(
  csrfToken: string,
  origin: string,
  options?: { isMobile?: boolean }
): Promise<
  ActionResponse<PublicKeyCredentialCreationOptionsJSON & { prfSalt: string }>
> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  const isMobile = options?.isMobile === true;

  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    // Get current user - must be authenticated to register a passkey
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Must be authenticated to register a passkey",
      };
    }

    const rpId = getRpId(origin);

    // Use adminClient to bypass deny-all RLS policy on user_auth_credentials
    const { data: existingCredentials } = await adminClient
      .from("user_auth_credentials")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    const excludeCredentials =
      existingCredentials?.map((cred) => ({
        id: cred.credential_id,
        transports: (cred.transports ?? []) as AuthenticatorTransportFuture[],
      })) ?? [];

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: rpId,
      userName: user.email ?? user.id, // Show email in passkey dialog
      userDisplayName: user.email ?? "Helvety User",
      userID: new TextEncoder().encode(user.id), // Keep UUID for internal WebAuthn ID
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: isMobile
        ? {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required",
            requireResidentKey: true,
          }
        : {
            authenticatorAttachment: "cross-platform",
            userVerification: "required",
            residentKey: "required",
            requireResidentKey: true,
          },
      timeout: 60000,
    };

    const regOptions = await generateRegOptions(opts);

    // Generate PRF salt for encryption key derivation
    const prfSalt = generatePRFSalt();

    // Hints: mobile = this device; desktop = phone via QR (hybrid)
    // Note: PRF extension is added client-side in encryption-setup.tsx since
    // Uint8Array cannot be serialized from server to client components
    const optionsWithHints = {
      ...regOptions,
      hints: (isMobile ? ["client-device"] : ["hybrid"]) as (
        | "hybrid"
        | "security-key"
        | "client-device"
      )[],
    };

    // Store challenge and PRF salt for verification
    await storeChallenge({
      challenge: regOptions.challenge,
      userId: user.id,
      prfSalt,
    });

    return {
      success: true,
      data: { ...optionsWithHints, prfSalt },
    };
  } catch (error) {
    logger.error("Error generating registration options:", error);
    return { success: false, error: "Failed to generate registration options" };
  }
}

/**
 * Verify passkey registration and store the credential
 * Called after the user completes the WebAuthn registration ceremony
 *
 * Also stores PRF params for encryption if PRF was enabled.
 *
 * Security:
 * - CSRF token validation
 * - Requires authenticated user
 * - WebAuthn ceremony verification with server-generated challenge (httpOnly cookie)
 *
 * @param csrfToken - CSRF token for request validation
 * @param response - The registration response from the browser
 * @param origin - The origin URL
 * @param prfEnabled - Whether PRF was enabled during registration
 * @returns Success status and credential info
 */
export async function verifyPasskeyRegistration(
  csrfToken: string,
  response: RegistrationResponseJSON,
  origin: string,
  prfEnabled: boolean = false
): Promise<ActionResponse<{ credentialId: string; prfSalt?: string }>> {
  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    };
  }

  try {
    const supabase = await createServerClient();
    const adminClient = createAdminClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: "Must be authenticated to verify registration",
      };
    }

    // Retrieve stored challenge
    const storedData = await getStoredChallenge();
    if (!storedData) {
      return { success: false, error: "Challenge expired or not found" };
    }

    // Verify the user ID matches
    if (storedData.userId !== user.id) {
      return { success: false, error: "User mismatch" };
    }

    const rpId = getRpId(origin);
    const expectedOrigins = getExpectedOrigins(rpId);

    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: storedData.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      requireUserVerification: true,
    };

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      logger.error("Registration verification failed:", error);
      return { success: false, error: "Registration verification failed" };
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Registration verification failed" };
    }

    const { registrationInfo } = verification;
    const { credential, credentialDeviceType, credentialBackedUp } =
      registrationInfo;

    // Convert Uint8Array to base64url string for storage
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString(
      "base64url"
    );

    // Use adminClient to bypass deny-all RLS policy on user_auth_credentials
    const { error: insertError } = await adminClient
      .from("user_auth_credentials")
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: publicKeyBase64,
        counter: credential.counter,
        transports: credential.transports ?? [],
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
      });

    if (insertError) {
      logger.error("Error storing credential:", insertError);
      return { success: false, error: "Failed to store credential" };
    }

    // If PRF was enabled, store PRF params for encryption
    let savedPrfSalt: string | undefined;
    if (prfEnabled && storedData.prfSalt) {
      const { error: prfError } = await supabase
        .from("user_passkey_params")
        .upsert(
          {
            user_id: user.id,
            prf_salt: storedData.prfSalt,
            credential_id: credential.id,
            version: PRF_VERSION,
          },
          { onConflict: "user_id" }
        );

      if (prfError) {
        logger.error("Error storing PRF params:", prfError);
        // Don't fail the entire registration, just log the error
        // The user can still use the passkey for auth
      } else {
        savedPrfSalt = storedData.prfSalt;
      }
    }

    // Clear the challenge
    await clearChallenge();

    return {
      success: true,
      data: { credentialId: credential.id, prfSalt: savedPrfSalt },
    };
  } catch (error) {
    logger.error("Error verifying registration:", error);
    return { success: false, error: "Failed to verify registration" };
  }
}
