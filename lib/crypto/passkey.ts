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
 * Detect if running on a mobile device via user agent
 * This checks for actual mobile devices, not just screen width
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if platform authenticator supports PRF extension
 * Uses getClientCapabilities() on Chrome 133+, falls back to heuristics
 *
 * PRF is supported on:
 * - iOS 18+, macOS 15+ (Safari)
 * - Android 14+ (Chrome 128+)
 * - Windows 11 (Chrome/Edge 128+)
 */
export async function getPlatformPRFSupport(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }

  // Modern API (Chrome 133+) - checks platform authenticator PRF support directly
  if ("getClientCapabilities" in PublicKeyCredential) {
    try {
      const getClientCapabilities = (
        PublicKeyCredential as typeof PublicKeyCredential & {
          getClientCapabilities: () => Promise<Record<string, boolean>>;
        }
      ).getClientCapabilities;
      const caps = await getClientCapabilities();
      if (caps?.prf === true) return true;
    } catch {
      /* fall through to heuristics */
    }
  }

  // Fallback heuristics based on known platform support
  const ua = navigator.userAgent;

  // iOS 18+ / macOS 15+ Safari supports PRF for platform authenticators
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch?.[1] && parseInt(safariMatch[1]) >= 18) {
    // Safari on iOS/macOS with version 18+ supports PRF
    return true;
  }

  // Android Chrome 128+ supports PRF for platform authenticators
  if (/Android/.test(ua)) {
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch?.[1] && parseInt(chromeMatch[1]) >= 128) {
      return true;
    }
  }

  // Windows with Chrome/Edge 128+ may support PRF via Windows Hello
  // But we can't reliably detect this, so we return false to be safe
  // Users on Windows will use cross-device (QR code) flow

  return false;
}

/**
 * Device capability information for passkey operations
 */
export interface DeviceCapabilities {
  /** Whether the device is a mobile device (phone/tablet) */
  isMobile: boolean;
  /** Whether a platform authenticator is available */
  hasPlatformAuthenticator: boolean;
  /** Whether the platform authenticator supports PRF extension */
  platformSupportsPRF: boolean;
  /** Whether to use platform authenticator for passkey operations */
  usePlatformAuth: boolean;
}

/**
 * Get comprehensive device capabilities for passkey operations
 * This helps determine the best authentication flow for the current device
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isMobile = isMobileDevice();
  const hasPlatformAuthenticator = await isPlatformAuthenticatorAvailable();
  const platformSupportsPRF = await getPlatformPRFSupport();

  // Use platform auth on mobile devices with PRF support
  // This allows Face ID, Touch ID, Fingerprint to work directly
  const usePlatformAuth = isMobile && hasPlatformAuthenticator && platformSupportsPRF;

  return {
    isMobile,
    hasPlatformAuthenticator,
    platformSupportsPRF,
    usePlatformAuth,
  };
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
 * Automatically detects device capabilities to determine whether to prefer:
 * - Platform authenticator (Face ID, Touch ID, Fingerprint) on mobile devices with PRF support
 * - Cross-platform authenticator (phone via QR code) on desktop or unsupported mobile
 *
 * @param allowCredentials - Optional list of credential IDs to allow
 * @param prfSalt - PRF salt for encryption key derivation (base64 encoded)
 */
export async function generateAuthenticationOptions(
  allowCredentials?: string[],
  prfSalt?: string
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const rpConfig = getRPConfig();
  const capabilities = await getDeviceCapabilities();

  // Generate a random challenge
  const challenge = base64Encode(crypto.getRandomValues(new Uint8Array(32)));

  const options: PublicKeyCredentialRequestOptionsJSON = {
    challenge,
    rpId: rpConfig.rpId,
    timeout: 60000,
    userVerification: "required",
  };

  // Add allowed credentials if provided
  // Include all transports for maximum flexibility - the browser will filter
  // based on what's actually available for each credential
  if (allowCredentials && allowCredentials.length > 0) {
    options.allowCredentials = allowCredentials.map((id) => ({
      id,
      type: "public-key",
      // Include all transports so credentials can be used from any source
      transports: ["internal", "hybrid", "usb", "ble", "nfc"],
    }));
  }

  // Set hints based on device capabilities
  // "client-device" hints to use the current device's authenticator
  // "hybrid" hints to use cross-device flow (QR code)
  (
    options as PublicKeyCredentialRequestOptionsJSON & { hints?: string[] }
  ).hints = capabilities.usePlatformAuth ? ["client-device"] : ["hybrid"];

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
  const options = await generateAuthenticationOptions(credentialIds, prfSalt);
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
