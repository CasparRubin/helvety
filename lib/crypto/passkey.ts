/**
 * Passkey Module
 * Handles WebAuthn passkey registration and authentication with PRF extension
 *
 * This module provides the bridge between WebAuthn/passkeys and encryption.
 * It uses SimpleWebAuthn browser helpers and integrates with Supabase for storage.
 */

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

import { base64Encode, base64Decode } from "./encoding";
import { CryptoError, CryptoErrorType } from "./types";

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

/**
 * Relying Party configuration
 */
export interface RPConfig {
  /** Domain name (e.g., 'localhost' for dev, 'helvety.com' for prod) */
  rpId: string;
  /** Human-readable name shown in passkey prompts */
  rpName: string;
  /** Origin URL (e.g., 'http://localhost:3000') */
  origin: string;
}

/**
 * Get RP config based on the current browser location
 *
 * Note: The rpId MUST match the actual domain for WebAuthn security.
 * WebAuthn automatically uses the current domain, so no configuration needed.
 *
 * The rpName is the human-readable name shown in password managers.
 */
export function getRPConfig(): RPConfig {
  // Always use "Helvety Store" as the display name
  const rpName = "Helvety Store";

  if (typeof window === "undefined") {
    // Server-side fallback (passkey operations should only happen client-side)
    return {
      rpId: "localhost",
      rpName,
      origin: "http://localhost:3000",
    };
  }

  // Client-side: Always use the current hostname
  // WebAuthn requires rpId to match the actual domain
  return {
    rpId: window.location.hostname,
    rpName,
    origin: window.location.origin,
  };
}

/**
 * Passkey registration result with PRF output for encryption setup
 */
export interface PasskeyRegistrationResult {
  /** The WebAuthn registration response to send to server */
  response: RegistrationResponseJSON;
  /** Credential ID (base64url encoded) */
  credentialId: string;
  /** PRF output for deriving encryption key (if PRF supported) */
  prfOutput?: ArrayBuffer;
  /** Whether PRF was enabled during registration */
  prfEnabled: boolean;
}

/**
 * Passkey authentication result with PRF output for encryption unlock
 */
export interface PasskeyAuthenticationResult {
  /** The WebAuthn authentication response to send to server */
  response: AuthenticationResponseJSON;
  /** Credential ID used (base64url encoded) */
  credentialId: string;
  /** PRF output for deriving encryption key */
  prfOutput?: ArrayBuffer;
  /** Whether PRF was used during authentication */
  prfEnabled: boolean;
}

/**
 * Check if the browser supports WebAuthn passkeys
 */
export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Check if a platform authenticator is available (Face ID, Touch ID, Windows Hello)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  return platformAuthenticatorIsAvailable();
}

/**
 * Generate registration options for creating a new passkey
 * This should be called on the server, but we provide client-side generation for simplicity
 *
 * @param userId - The user's ID
 * @param userEmail - The user's email
 * @param userName - The user's display name
 * @param prfSalt - Optional PRF salt for encryption (base64 encoded)
 */
export function generateRegistrationOptions(
  userId: string,
  userEmail: string,
  userName: string,
  prfSalt?: string
): PublicKeyCredentialCreationOptionsJSON {
  const rpConfig = getRPConfig();

  // Generate a random challenge
  const challenge = base64Encode(crypto.getRandomValues(new Uint8Array(32)));

  const options: PublicKeyCredentialCreationOptionsJSON = {
    challenge,
    rp: {
      id: rpConfig.rpId,
      name: rpConfig.rpName,
    },
    user: {
      id: base64Encode(new TextEncoder().encode(userId)),
      name: userEmail,
      displayName: userName || userEmail,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      // Force cross-platform authenticators only (phones via QR code)
      // This excludes Windows Hello, Touch ID, and other platform authenticators
      authenticatorAttachment: "cross-platform",
      userVerification: "required",
      residentKey: "required",
      requireResidentKey: true,
    },
    timeout: 60000,
    attestation: "none",
  };

  // Hint to prefer phone authenticators (hybrid) over security keys
  (
    options as PublicKeyCredentialCreationOptionsJSON & { hints?: string[] }
  ).hints = ["hybrid"];

  // Add PRF extension if salt provided
  if (prfSalt) {
    (
      options as PublicKeyCredentialCreationOptionsJSON & {
        extensions?: Record<string, unknown>;
      }
    ).extensions = {
      prf: {
        eval: {
          first: base64Decode(prfSalt),
        },
      },
    };
  }

  return options;
}

/**
 * Generate authentication options for signing in with a passkey
 *
 * @param allowCredentials - Optional list of credential IDs to allow
 * @param prfSalt - PRF salt for encryption key derivation (base64 encoded)
 */
export function generateAuthenticationOptions(
  allowCredentials?: string[],
  prfSalt?: string
): PublicKeyCredentialRequestOptionsJSON {
  const rpConfig = getRPConfig();

  // Generate a random challenge
  const challenge = base64Encode(crypto.getRandomValues(new Uint8Array(32)));

  const options: PublicKeyCredentialRequestOptionsJSON = {
    challenge,
    rpId: rpConfig.rpId,
    timeout: 60000,
    userVerification: "required",
  };

  // Add allowed credentials if provided
  if (allowCredentials && allowCredentials.length > 0) {
    options.allowCredentials = allowCredentials.map((id) => ({
      id,
      type: "public-key",
      // Only hint hybrid (phone via QR) since we force cross-platform authenticators
      transports: ["hybrid"],
    }));
  }

  // Hint to prefer phone authenticators over security keys
  (
    options as PublicKeyCredentialRequestOptionsJSON & { hints?: string[] }
  ).hints = ["hybrid"];

  // Add PRF extension if salt provided
  if (prfSalt) {
    (
      options as PublicKeyCredentialRequestOptionsJSON & {
        extensions?: Record<string, unknown>;
      }
    ).extensions = {
      prf: {
        eval: {
          first: base64Decode(prfSalt),
        },
      },
    };
  }

  return options;
}

/**
 * Register a new passkey with PRF extension for encryption
 *
 * Note: PRF output is only returned during authentication, not registration.
 * Registration only tells us if PRF is enabled/supported by the authenticator.
 *
 * @param options - Registration options from server or generateRegistrationOptions
 * @returns Registration result (prfEnabled indicates if PRF is supported)
 */
export async function registerPasskey(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<PasskeyRegistrationResult> {
  try {
    const response = await startRegistration({ optionsJSON: options });

    // During registration, PRF only returns 'enabled' status, not actual output
    // The actual PRF output is only available during authentication
    const clientExtResults = response.clientExtensionResults as {
      prf?: { enabled?: boolean };
    };

    // PRF is considered enabled if the extension was processed
    // Note: Some authenticators return enabled:true, others just include the prf object
    const prfEnabled = clientExtResults.prf !== undefined;

    return {
      response,
      credentialId: response.id,
      prfOutput: undefined, // PRF output only available during authentication
      prfEnabled,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new CryptoError(
          CryptoErrorType.KEY_DERIVATION_FAILED,
          "Passkey registration was cancelled or not allowed"
        );
      }
      if (error.name === "InvalidStateError") {
        throw new CryptoError(
          CryptoErrorType.KEY_DERIVATION_FAILED,
          "A passkey already exists for this account on this device"
        );
      }
    }
    throw new CryptoError(
      CryptoErrorType.KEY_DERIVATION_FAILED,
      "Failed to register passkey",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Authenticate with a passkey and get PRF output for encryption
 *
 * @param options - Authentication options from server or generateAuthenticationOptions
 * @returns Authentication result with PRF output for encryption unlock
 */
export async function authenticateWithPasskey(
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<PasskeyAuthenticationResult> {
  try {
    const response = await startAuthentication({ optionsJSON: options });

    // Extract PRF output if available
    const clientExtResults = response.clientExtensionResults as {
      prf?: { results?: { first?: ArrayBuffer } };
    };

    const prfOutput = clientExtResults.prf?.results?.first;
    const prfEnabled = prfOutput !== undefined;

    return {
      response,
      credentialId: response.id,
      prfOutput,
      prfEnabled,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new CryptoError(
          CryptoErrorType.KEY_DERIVATION_FAILED,
          "Passkey authentication was cancelled or not allowed"
        );
      }
      if (error.name === "SecurityError") {
        throw new CryptoError(
          CryptoErrorType.KEY_DERIVATION_FAILED,
          "Security error during passkey authentication"
        );
      }
    }
    throw new CryptoError(
      CryptoErrorType.KEY_DERIVATION_FAILED,
      "Failed to authenticate with passkey",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Combined passkey registration and encryption setup
 * Use this for new user onboarding
 *
 * @param userId - User's ID
 * @param userEmail - User's email
 * @param prfSalt - PRF salt for encryption (base64 encoded)
 */
export async function registerPasskeyWithEncryption(
  userId: string,
  userEmail: string,
  prfSalt: string
): Promise<PasskeyRegistrationResult> {
  const options = generateRegistrationOptions(
    userId,
    userEmail,
    userEmail,
    prfSalt
  );
  return registerPasskey(options);
}

/**
 * Combined passkey authentication and encryption unlock
 * Use this for returning user sign-in
 *
 * @param credentialIds - Optional list of allowed credential IDs
 * @param prfSalt - PRF salt for encryption (base64 encoded)
 */
export async function authenticatePasskeyWithEncryption(
  credentialIds?: string[],
  prfSalt?: string
): Promise<PasskeyAuthenticationResult> {
  const options = generateAuthenticationOptions(credentialIds, prfSalt);
  return authenticateWithPasskey(options);
}
