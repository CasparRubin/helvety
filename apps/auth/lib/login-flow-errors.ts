import {
  isRateLimitedAuthMessage,
  mapPasskeyRegistrationWebAuthnError,
  mapPasskeyWebAuthnError,
  rateLimitedAuthUserMessage,
} from "@helvety/shared/auth-flow-errors";

import type { LoginStep } from "@/lib/login-flow-stepper";

export {
  isRateLimitedAuthMessage,
  mapPasskeyRegistrationWebAuthnError,
  mapPasskeyWebAuthnError,
};

/** Who initiated the WebAuthn passkey ceremony. */
export type PasskeyCeremonySource = "auto" | "user";

/** Source of a login-flow error for surfacing policy. */
export type LoginErrorSource = "bootstrap" | "email" | "otp" | "passkey";

/** Context for deciding whether to show inline errors and toasts. */
export type ShouldSurfaceLoginErrorInput = {
  otpVerifySucceeded: boolean;
  step: LoginStep;
  source: LoginErrorSource;
  ceremonySource?: PasskeyCeremonySource;
  webAuthnErrorName?: string;
};

const SESSION_RESTORE_ENTRY_STEPS = new Set<LoginStep>([
  "passkey-signin",
  "encryption-setup",
]);

/**
 * Returns true when the login UI should show an error toast and inline message.
 * Suppresses stale bootstrap noise after OTP success and silent auto-passkey
 * WebAuthn dismissals (`NotAllowedError` / `AbortError` when `ceremonySource`
 * is `"auto"` — mobile-only; desktop passkey always uses `"user"`).
 */
export function shouldSurfaceLoginError(
  input: ShouldSurfaceLoginErrorInput
): boolean {
  if (input.otpVerifySucceeded && input.source === "bootstrap") {
    return false;
  }

  if (input.source === "passkey" && input.ceremonySource === "auto") {
    const name = input.webAuthnErrorName;
    if (name === "NotAllowedError" || name === "AbortError") {
      return false;
    }
  }

  return true;
}

/** Returns true when bootstrap should treat auth probe failures as session-restore errors. */
export function expectsExistingSessionOnBootstrap(options: {
  initialStep: LoginStep;
  initialTrustedUserId: string | null;
  initialError?: string;
  urlStep: LoginStep | null;
}): boolean {
  if (options.initialError) {
    return true;
  }
  if (options.initialTrustedUserId) {
    return true;
  }
  if (SESSION_RESTORE_ENTRY_STEPS.has(options.initialStep)) {
    return true;
  }
  if (options.urlStep && SESSION_RESTORE_ENTRY_STEPS.has(options.urlStep)) {
    return true;
  }
  return false;
}

/** Maps bootstrap probe failures to user-facing copy (or null to stay silent). */
export function resolveBootstrapFriendlyError(
  message: string,
  expectsSessionRestore: boolean
): string | null {
  if (message === "AUTH_PROBE_TIMEOUT") {
    return expectsSessionRestore
      ? "We could not restore your session in time. Please sign in."
      : null;
  }

  if (isRateLimitedAuthMessage(message)) {
    return rateLimitedAuthUserMessage();
  }

  return expectsSessionRestore
    ? "We could not restore your session. Please sign in."
    : null;
}
