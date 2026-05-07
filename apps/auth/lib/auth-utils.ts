/**
 * Resolves which login step the user still needs (passkey setup vs passkey sign-in),
 * or reports `not_authenticated` / `unavailable` when server actions cannot determine readiness.
 *
 * Implemented via server actions (`getOwnPasskeyStatus`, `hasEncryptionSetup`); safe from client code (e.g. `useLoginFlow`).
 */

import { isAuthRequiredError } from "@helvety/shared/auth-errors";

import { getOwnPasskeyStatus } from "@/app/actions/credential-actions";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";
import { resolveAuthStep } from "@/lib/auth-step";

import type { RequiredAuthStep } from "@/lib/auth-step";

/** Outcome of probing passkey + encryption readiness for the current session. */
type AuthStepProbeResult =
  | {
      status: "ok";
      step: RequiredAuthStep;
      hasPasskey: boolean;
      hasEncryption: boolean;
    }
  | { status: "not_authenticated" }
  | { status: "unavailable"; message?: string };

/**
 * Determines the required authentication step for a user, or why the probe failed.
 *
 * Logic when both actions succeed:
 * - No passkey: needs encryption-setup (which includes passkey creation)
 * - Has passkey but no encryption: needs encryption-setup
 * - Has both: needs passkey-signin (to authenticate with passkey)
 *
 * Any `success: false` that is not a definitive unauthenticated session is
 * **unavailable** (do not route to encryption-setup).
 */
export async function getRequiredAuthStep(): Promise<AuthStepProbeResult> {
  const passkeyResult = await getOwnPasskeyStatus();

  if (!passkeyResult.success) {
    if (isAuthRequiredError(passkeyResult.error)) {
      return { status: "not_authenticated" };
    }
    return {
      status: "unavailable",
      message: passkeyResult.error,
    };
  }

  const encryptionResult = await hasEncryptionSetup();

  if (!encryptionResult.success) {
    if (isAuthRequiredError(encryptionResult.error)) {
      return { status: "not_authenticated" };
    }
    return {
      status: "unavailable",
      message: encryptionResult.error,
    };
  }

  const hasPasskey = Boolean(passkeyResult.data?.hasPasskey);
  const hasEncryption = Boolean(encryptionResult.data);

  const step = resolveAuthStep({
    hasPasskey,
    hasEncryption,
  });

  return {
    status: "ok",
    step,
    hasPasskey,
    hasEncryption,
  };
}
