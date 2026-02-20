/**
 * Passkey Module
 * Handles WebAuthn passkey registration and authentication with PRF extension
 *
 * This module provides the bridge between WebAuthn/passkeys and both authentication
 * and encryption. It uses SimpleWebAuthn browser helpers and integrates PRF extension
 * for E2EE key derivation.
 */

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

import { DOMAIN, urls } from "../config";

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
  /** Origin URL (e.g., 'https://helvety.com/auth') */
  origin: string;
}

/**
 * Get RP config based on the current browser location
 *
 * IMPORTANT: For centralized auth, we use 'helvety.com' as the rpId in production.
 * All apps are served under helvety.com via path-based routing (multi-zone),
 * so passkeys work across all apps (helvety.com/auth, helvety.com/tasks, etc.)
 */
export function getRPConfig(): RPConfig {
  const rpName = "Helvety";

  if (typeof window === "undefined") {
    // Server-side fallback (passkey operations should only happen client-side)
    return {
      rpId: process.env.NODE_ENV === "development" ? "localhost" : DOMAIN,
      rpName,
      origin: urls.auth,
    };
  }

  // In production, use the root domain for passkey sharing across all apps
  // In development, use localhost
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return {
    rpId: isDev ? "localhost" : DOMAIN,
    rpName,
    origin: window.location.origin,
  };
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
 * Crypto error types for passkey operations
 */
enum PasskeyErrorType {
  NOT_SUPPORTED = "NOT_SUPPORTED",
  CANCELLED = "CANCELLED",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  SECURITY_ERROR = "SECURITY_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Passkey error class
 */
class PasskeyError extends Error {
  constructor(
    public type: PasskeyErrorType,
    message: string,
    public override cause?: Error
  ) {
    super(message);
    this.name = "PasskeyError";
  }
}

/**
 * Passkey registration result with PRF output for encryption setup
 */
interface PasskeyRegistrationResult {
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
 * Base64 encode a Uint8Array
 */
function base64Encode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/**
 * Base64 decode a string to Uint8Array
 */
function base64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
 * On Chrome 132+ (released January 2025), PRF output is returned during registration
 * via navigator.credentials.create(). This allows deriving the master
 * encryption key immediately, eliminating a separate passkey touch for
 * E2EE unlock. On older browsers, only { enabled } is returned and the
 * first E2EE unlock requires a separate authentication touch.
 *
 * @param options - Registration options from server or generateRegistrationOptions
 * @returns Registration result with prfOutput (if browser supports it) and prfEnabled flag
 */
export async function registerPasskey(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<PasskeyRegistrationResult> {
  try {
    const response = await startRegistration({ optionsJSON: options });

    // Check for PRF extension results.
    // Chrome 132+ (released January 2025) supports returning PRF output during registration
    // via navigator.credentials.create(). Older browsers only return { enabled }.
    const clientExtResults = response.clientExtensionResults as {
      prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
    };

    // Extract PRF output if the authenticator returned it during registration
    const prfOutput = clientExtResults.prf?.results?.first;

    // PRF is considered enabled if the extension was processed or output was returned
    const prfEnabled =
      clientExtResults.prf !== undefined || prfOutput !== undefined;

    return {
      response,
      credentialId: response.id,
      prfOutput, // Available on Chrome 132+ during registration, undefined on older browsers
      prfEnabled,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        throw new PasskeyError(
          PasskeyErrorType.CANCELLED,
          "Passkey registration was cancelled or not allowed"
        );
      }
      if (error.name === "InvalidStateError") {
        throw new PasskeyError(
          PasskeyErrorType.ALREADY_EXISTS,
          "A passkey already exists for this account on this device"
        );
      }
    }
    throw new PasskeyError(
      PasskeyErrorType.UNKNOWN,
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
        throw new PasskeyError(
          PasskeyErrorType.CANCELLED,
          "Passkey authentication was cancelled or not allowed"
        );
      }
      if (error.name === "SecurityError") {
        throw new PasskeyError(
          PasskeyErrorType.SECURITY_ERROR,
          "Security error during passkey authentication"
        );
      }
    }
    throw new PasskeyError(
      PasskeyErrorType.UNKNOWN,
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

// Re-export PRF support utilities from the canonical location
// to maintain backward compatibility for consumers of this module
export {
  isPRFSupported,
  getPRFSupportInfo,
  type PRFSupportInfo,
} from "./prf-key-derivation";
