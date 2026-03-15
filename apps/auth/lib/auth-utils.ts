/**
 * Client-side auth utilities for determining the required authentication step
 *
 * These utilities help the login flow determine what step the user needs
 * to complete (passkey setup or sign-in).
 */

import { getOwnPasskeyStatus } from "@/app/actions/credential-actions";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";

/** The authentication step the user needs to complete */
export type AuthStep = "encryption-setup" | "passkey-signin";

/** Result of checking the required auth step */
export interface AuthStepResult {
  step: AuthStep;
  hasPasskey: boolean;
  hasEncryption: boolean;
}

/**
 * Determines the required authentication step for a user
 *
 * @returns The required step and current status
 *
 * Logic:
 * - No passkey: needs encryption-setup (which includes passkey creation)
 * - Has passkey but no encryption: needs encryption-setup
 * - Has both: needs passkey-signin (to authenticate with passkey)
 *
 * Note: After passkey auth completes, the session is created directly server-side
 * in verifyPasskeyAuthentication() and the user is redirected to their destination.
 */
export async function getRequiredAuthStep(): Promise<AuthStepResult> {
  // Check if the authenticated user has a passkey registered
  const passkeyResult = await getOwnPasskeyStatus();
  const hasPasskey = passkeyResult.success && passkeyResult.data?.hasPasskey;

  // Check if user has encryption setup (PRF params)
  const encryptionResult = await hasEncryptionSetup();
  const hasEncryption = encryptionResult.success && encryptionResult.data;

  // Determine the appropriate step
  let step: AuthStep;
  if (!hasPasskey) {
    // New user - needs full passkey + encryption setup
    step = "encryption-setup";
  } else if (!hasEncryption) {
    // Has passkey but no encryption - needs encryption setup only
    step = "encryption-setup";
  } else {
    // Has everything - needs to authenticate with passkey
    step = "passkey-signin";
  }

  return {
    step,
    hasPasskey: !!hasPasskey,
    hasEncryption: !!hasEncryption,
  };
}
