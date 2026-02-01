/**
 * Passkey Module
 * Handles WebAuthn passkey authentication with PRF extension for encryption
 *
 * This module provides the bridge between WebAuthn/passkeys and encryption.
 * It uses SimpleWebAuthn browser helpers for authentication only (not setup).
 * Setup is handled by auth.helvety.com.
 */

import {
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

import { base64Encode, base64Decode } from "./encoding";
import { CryptoError, CryptoErrorType } from "./types";

import type {
  PublicKeyCredentialRequestOptionsJSON,
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
  /** Origin URL (e.g., 'https://helvety.com') */
  origin: string;
}

/**
 * Get RP config based on the current browser location
 *
 * IMPORTANT: For centralized auth, we use 'helvety.com' as the rpId in production.
 * This allows passkeys registered on auth.helvety.com to work across all subdomains.
 */
export function getRPConfig(): RPConfig {
  const rpName = "Helvety";

  if (typeof window === "undefined") {
    // Server-side fallback (passkey operations should only happen client-side)
    return {
      rpId: "localhost",
      rpName,
      origin: "http://localhost:3000",
    };
  }

  // In production, use the root domain for cross-subdomain passkey sharing
  // In development, use localhost
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return {
    rpId: isDev ? "localhost" : "helvety.com",
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
 * Generate authentication options for unlocking encryption with a passkey
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
 * Authenticate with a passkey and get PRF output for encryption
 *
 * @param options - Authentication options from generateAuthenticationOptions
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
          CryptoErrorType.PASSKEY_AUTHENTICATION_FAILED,
          "Passkey authentication was cancelled or not allowed"
        );
      }
      if (error.name === "SecurityError") {
        throw new CryptoError(
          CryptoErrorType.PASSKEY_AUTHENTICATION_FAILED,
          "Security error during passkey authentication"
        );
      }
    }
    throw new CryptoError(
      CryptoErrorType.PASSKEY_AUTHENTICATION_FAILED,
      "Failed to authenticate with passkey",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Authenticate with passkey and get PRF output for encryption unlock
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

/**
 * Check if the browser supports WebAuthn PRF extension
 */
export async function isPRFSupported(): Promise<boolean> {
  // Check if WebAuthn is available
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }

  const ua = navigator.userAgent;
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);

  // Check Firefox - supports PRF on desktop from version 139+ (not on Android)
  if (firefoxMatch?.[1]) {
    const isAndroid = ua.includes("Android");
    if (isAndroid) {
      return false;
    }
    return parseInt(firefoxMatch[1]) >= 139;
  }

  // Check Edge first (Edge UA contains both "Chrome" and "Edg")
  if (edgeMatch?.[1]) {
    return parseInt(edgeMatch[1]) >= 128;
  }
  if (chromeMatch?.[1]) {
    return parseInt(chromeMatch[1]) >= 128;
  }
  if (safariMatch?.[1]) {
    return parseInt(safariMatch[1]) >= 18;
  }

  return true;
}

/**
 * Get detailed PRF support information for UI display
 */
export interface PRFSupportInfo {
  supported: boolean;
  reason?: string;
  browserInfo?: string;
}

/**
 *
 */
export async function getPRFSupportInfo(): Promise<PRFSupportInfo> {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Not in browser environment" };
  }

  if (!window.PublicKeyCredential) {
    return { supported: false, reason: "WebAuthn not supported" };
  }

  const ua = navigator.userAgent;
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);

  if (firefoxMatch?.[1]) {
    const version = parseInt(firefoxMatch[1]);
    const isAndroid = ua.includes("Android");
    if (isAndroid) {
      return {
        supported: false,
        reason: "Firefox for Android does not support the PRF extension",
        browserInfo: `Firefox for Android ${version}`,
      };
    }
    if (version < 139) {
      return {
        supported: false,
        reason: `Firefox ${version} detected. PRF requires Firefox 139 or later.`,
        browserInfo: `Firefox ${version}`,
      };
    }
    return { supported: true, browserInfo: `Firefox ${version}` };
  }

  if (edgeMatch?.[1]) {
    const version = parseInt(edgeMatch[1]);
    if (version < 128) {
      return {
        supported: false,
        reason: `Edge ${version} detected. PRF requires Edge 128 or later.`,
        browserInfo: `Edge ${version}`,
      };
    }
    return { supported: true, browserInfo: `Edge ${version}` };
  }

  if (chromeMatch?.[1]) {
    const version = parseInt(chromeMatch[1]);
    if (version < 128) {
      return {
        supported: false,
        reason: `Chrome ${version} detected. PRF requires Chrome 128 or later.`,
        browserInfo: `Chrome ${version}`,
      };
    }
    return { supported: true, browserInfo: `Chrome ${version}` };
  }

  if (safariMatch?.[1]) {
    const version = parseInt(safariMatch[1]);
    if (version < 18) {
      return {
        supported: false,
        reason: `Safari ${version} detected. PRF requires Safari 18 or later.`,
        browserInfo: `Safari ${version}`,
      };
    }
    return { supported: true, browserInfo: `Safari ${version}` };
  }

  return { supported: true, browserInfo: "Unknown browser" };
}
