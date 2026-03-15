import {
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

/**
 * Check if the browser supports WebAuthn passkeys
 */
export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Crypto error types for passkey operations
 */
enum PasskeyErrorType {
  CANCELLED = "CANCELLED",
  ALREADY_EXISTS = "ALREADY_EXISTS",
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
 * Register a new passkey with PRF extension for encryption
 *
 * In many modern browser flows, PRF output is returned during registration via
 * navigator.credentials.create(). This can allow deriving the master
 * encryption key immediately and reduce extra unlock prompts. In other flows,
 * only { enabled } is returned and the first E2EE unlock may require a
 * separate authentication touch.
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
    // Some browsers return PRF output during registration; others only return { enabled }.
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
      prfOutput, // Available in supporting registration flows; undefined otherwise
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

// Re-export PRF support utilities from the canonical location
// to maintain backward compatibility for consumers of this module
export {
  isPRFSupported,
  getPRFSupportInfo,
  type PRFSupportInfo,
} from "./prf-key-derivation";
