"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { PRF_VERSION } from "@helvety/shared/crypto";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import {
  generateRegistrationOptions as generateRegOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { z } from "zod";

import { RATE_LIMITS } from "@/lib/rate-limit";

import {
  RP_NAME,
  OriginUrlSchema,
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

const PasskeyRegistrationResponseSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal("public-key"),
  response: z.object({
    clientDataJSON: z.string().min(1),
    attestationObject: z.string().min(1),
    transports: z.array(z.string()).optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    publicKey: z.string().optional(),
    authenticatorData: z.string().optional(),
  }),
  authenticatorAttachment: z.string().optional(),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
});

/** Narrow server-validated registration payload type. */
type PasskeyRegistrationResponse = z.infer<
  typeof PasskeyRegistrationResponseSchema
>;

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

// =============================================================================
// PASSKEY REGISTRATION (for authenticated users)
// =============================================================================

/**
 * Generate passkey registration options for an authenticated user
 * Called when a user wants to add a new passkey to their existing account
 *
 * This includes PRF extension for E2EE encryption key derivation.
 * When isMobile is true, uses platform authenticator (this device); otherwise
 * uses cross-platform registration for desktop (for example, hybrid/roaming
 * authenticators such as phone or security key).
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
  const originParse = OriginUrlSchema.safeParse(origin);
  if (!originParse.success) {
    return { success: false, error: "Failed to generate registration options" };
  }
  const safeOrigin = originParse.data;

  const isMobile = options?.isMobile === true;

  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "passkey_reg",
      rateLimitConfig: RATE_LIMITS.PASSKEY_REG,
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);
    const rpId = getRpId(safeOrigin);

    // Use scoped admin query (Supabase admin client using SUPABASE_SECRET_KEY; legacy service_role) because
    // user_auth_credentials has deny-all RLS for client roles. The same scoped read pattern is used in
    // checkUserPasskeyStatus (auth-action-helpers.ts) for login bootstrap (see apps/auth/README.md).
    const { data: existingCredentials } = await scopedAdmin
      .from("user_auth_credentials")
      .select("credential_id, transports");

    const excludeCredentials =
      existingCredentials?.map(
        (cred: { credential_id: string; transports: string[] | null }) => ({
          id: cred.credential_id,
          transports: toAuthenticatorTransports(cred.transports),
        })
      ) ?? [];

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

    // Hints: mobile = this device; desktop = cross-platform
    // (hybrid/roaming authenticators).
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
    logger.logUnexpectedError("Error generating registration options", error);
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
  response: PasskeyRegistrationResponse,
  origin: string,
  prfEnabled: boolean = false
): Promise<ActionResponse<{ credentialId: string; prfSalt?: string }>> {
  const originParse = OriginUrlSchema.safeParse(origin);
  if (!originParse.success) {
    return { success: false, error: "Failed to verify registration" };
  }
  const safeOrigin = originParse.data;

  try {
    const parsedResponse =
      PasskeyRegistrationResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      return { success: false, error: "Invalid passkey registration payload" };
    }

    const verifiedResponse: RegistrationResponseJSON = {
      id: parsedResponse.data.id,
      rawId: parsedResponse.data.rawId,
      type: parsedResponse.data.type,
      response: {
        ...parsedResponse.data.response,
        transports: toAuthenticatorTransports(
          parsedResponse.data.response.transports
        ),
      },
      clientExtensionResults: parsedResponse.data.clientExtensionResults ?? {},
    };

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "passkey_reg",
      rateLimitConfig: RATE_LIMITS.PASSKEY_REG,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);
    // Retrieve stored challenge
    const storedData = await getStoredChallenge();
    if (!storedData) {
      return { success: false, error: "Challenge expired or not found" };
    }

    // Verify the user ID matches
    if (storedData.userId !== user.id) {
      return { success: false, error: "User mismatch" };
    }

    const rpId = getRpId(safeOrigin);
    const expectedOrigins = getExpectedOrigins(rpId);

    const opts: VerifyRegistrationResponseOpts = {
      response: verifiedResponse,
      expectedChallenge: storedData.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      requireUserVerification: true,
    };

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      logger.logUnexpectedError("Registration verification failed", error);
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

    // Use scoped admin query (Supabase admin client using SUPABASE_SECRET_KEY; legacy service_role) because
    // user_auth_credentials has deny-all RLS for client roles. Same rationale as generatePasskeyRegistrationOptions.
    const { error: insertError } = await scopedAdmin
      .from("user_auth_credentials")
      .insert({
        credential_id: credential.id,
        public_key: publicKeyBase64,
        counter: credential.counter,
        transports: credential.transports ?? [],
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
      });

    if (insertError) {
      logger.logUnexpectedError("Error storing credential", insertError);
      return { success: false, error: "Failed to store credential" };
    }

    // If PRF was enabled, store PRF params for encryption.
    // Auth setup is only complete when both credential and encryption params
    // are persisted. Roll back the credential on encryption persistence failure.
    let savedPrfSalt: string | undefined;
    if (prfEnabled && !storedData.prfSalt) {
      logger.error("Missing PRF salt for passkey registration challenge.");
      const { error: rollbackError } = await scopedAdmin
        .from("user_auth_credentials")
        .delete()
        .eq("credential_id", credential.id);
      if (rollbackError) {
        logger.warn(
          "Failed to roll back credential after missing PRF salt:",
          rollbackError
        );
      }
      return {
        success: false,
        error: "Failed to complete encryption setup. Please try again.",
      };
    }

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
        logger.logUnexpectedError("Error storing PRF params", prfError);
        const { error: rollbackError } = await scopedAdmin
          .from("user_auth_credentials")
          .delete()
          .eq("credential_id", credential.id);
        if (rollbackError) {
          logger.warn(
            "Failed to roll back credential after PRF persistence error:",
            rollbackError
          );
        }
        return {
          success: false,
          error: "Failed to complete encryption setup. Please try again.",
        };
      } else {
        savedPrfSalt = storedData.prfSalt;
      }
    }

    return {
      success: true,
      data: { credentialId: credential.id, prfSalt: savedPrfSalt },
    };
  } catch (error) {
    logger.logUnexpectedError("Error verifying registration", error);
    return { success: false, error: "Failed to verify registration" };
  } finally {
    try {
      await clearChallenge();
    } catch (clearError) {
      logger.warn(
        "Failed to clear passkey registration challenge:",
        clearError
      );
    }
  }
}
