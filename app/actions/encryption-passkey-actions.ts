"use server";

import "server-only";

import {
  generateRegistrationOptions as generateRegOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// =============================================================================
// TYPES
// =============================================================================

export type PasskeyActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

type StoredChallenge = {
  challenge: string;
  userId?: string;
  timestamp: number;
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const RP_NAME = "Helvety";
const CHALLENGE_COOKIE_NAME = "webauthn_encryption_challenge";
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the Relying Party ID
 *
 * Uses 'helvety.com' in production for cross-subdomain passkey sharing.
 * Passkeys registered here will work on auth.helvety.com and vice versa.
 */
function getRpId(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "localhost";
    }
    return "helvety.com";
  } catch {
    return "localhost";
  }
}

/**
 * Get expected origins for verification
 */
function getExpectedOrigins(rpId: string): string[] {
  if (rpId === "localhost") {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ];
  }
  return [
    "https://helvety.com",
    "https://auth.helvety.com",
    "https://pdf.helvety.com",
    "https://store.helvety.com",
  ];
}

// =============================================================================
// CHALLENGE STORAGE
// =============================================================================

async function storeChallenge(
  challenge: string,
  userId?: string
): Promise<void> {
  const cookieStore = await cookies();
  const data: StoredChallenge = {
    challenge,
    userId,
    timestamp: Date.now(),
  };

  cookieStore.set(CHALLENGE_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CHALLENGE_EXPIRY_MS / 1000,
    path: "/",
  });
}

async function getStoredChallenge(): Promise<StoredChallenge | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CHALLENGE_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const data = JSON.parse(cookie.value) as StoredChallenge;
    if (Date.now() - data.timestamp > CHALLENGE_EXPIRY_MS) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function clearChallenge(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
}

// =============================================================================
// PASSKEY REGISTRATION FOR ENCRYPTION
// =============================================================================

/**
 * Generate passkey registration options for encryption setup
 * Called when a user wants to set up encryption with a new passkey
 *
 * @param origin - The origin URL
 * @returns Registration options to pass to the WebAuthn API
 */
export async function generatePasskeyRegistrationOptions(
  origin: string
): Promise<PasskeyActionResponse<PublicKeyCredentialCreationOptionsJSON>> {
  try {
    const supabase = await createClient();

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

    // Get existing credentials to exclude them
    const { data: existingCredentials } = await supabase
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
      userName: user.email ?? user.id,
      userDisplayName: user.email ?? "Helvety User",
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true,
      },
      timeout: 60000,
    };

    const options = await generateRegOptions(opts);

    const optionsWithHints = {
      ...options,
      hints: ["hybrid"] as ("hybrid" | "security-key" | "client-device")[],
    };

    await storeChallenge(options.challenge, user.id);

    return { success: true, data: optionsWithHints };
  } catch (error) {
    logger.error("Error generating registration options:", error);
    return { success: false, error: "Failed to generate registration options" };
  }
}

/**
 * Verify passkey registration and store the credential
 * Called after the user completes the WebAuthn registration ceremony
 *
 * @param response - The registration response from the browser
 * @param origin - The origin URL
 * @returns Success status and credential info
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  origin: string
): Promise<PasskeyActionResponse<{ credentialId: string }>> {
  try {
    const supabase = await createClient();

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

    const storedData = await getStoredChallenge();
    if (!storedData) {
      return { success: false, error: "Challenge expired or not found" };
    }

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

    const publicKeyBase64 = Buffer.from(credential.publicKey).toString(
      "base64url"
    );

    // Store the credential in the database
    const { error: insertError } = await supabase
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

    await clearChallenge();

    return {
      success: true,
      data: { credentialId: credential.id },
    };
  } catch (error) {
    logger.error("Error verifying registration:", error);
    return { success: false, error: "Failed to verify registration" };
  }
}
