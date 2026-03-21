/**
 * Resolves which login step the user still needs (passkey setup vs passkey sign-in).
 *
 * Implemented as async helpers that invoke server actions (`getOwnPasskeyStatus`,
 * `hasEncryptionSetup`); safe to call from client code (e.g. `useLoginFlow`).
 */

import { getOwnPasskeyStatus } from "@/app/actions/credential-actions";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";
import { resolveAuthStep } from "@/lib/auth-step";

import type { RequiredAuthStep } from "@/lib/auth-step";

/** The authentication step the user needs to complete */
export type AuthStep = RequiredAuthStep;

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

  const step = resolveAuthStep({
    hasPasskey: Boolean(hasPasskey),
    hasEncryption: Boolean(hasEncryption),
  });

  return {
    step,
    hasPasskey: !!hasPasskey,
    hasEncryption: !!hasEncryption,
  };
}
