/** The authentication step the user needs to complete. */
export type RequiredAuthStep = "encryption-setup" | "passkey-signin";

/** Minimal readiness state used to select next auth step. */
export interface PasskeyReadiness {
  hasPasskey: boolean;
  hasEncryption: boolean;
}

/**
 * Computes the canonical next auth step from passkey/encryption readiness.
 * This resolver is intentionally shared by OTP, callback, and bootstrap flows
 * to prevent divergent state transitions.
 */
export function resolveAuthStep({
  hasPasskey,
  hasEncryption,
}: PasskeyReadiness): RequiredAuthStep {
  if (!hasPasskey || !hasEncryption) {
    return "encryption-setup";
  }
  return "passkey-signin";
}
