import type { LoginStep } from "@/lib/login-flow-stepper";

const RATE_LIMIT_AUTH_ERROR_TOKENS = [
  "too many requests",
  "request rate limit reached",
  "429",
] as const;

/** Returns true when an auth API message indicates temporary rate-limiting. */
export function isRateLimitedAuthMessage(message: string | null): boolean {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return RATE_LIMIT_AUTH_ERROR_TOKENS.some((token) =>
    normalized.includes(token)
  );
}

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
    return "Authentication is temporarily rate-limited. Please wait a few seconds and try again.";
  }

  return expectsSessionRestore
    ? "We could not restore your session. Please sign in."
    : null;
}

/** Maps a WebAuthn error to user-facing passkey registration copy. */
export function mapPasskeyRegistrationWebAuthnError(err: unknown): string {
  if (err instanceof Error && err.name === "NotAllowedError") {
    return "Passkey creation was canceled. Please try again.";
  }
  if (err instanceof Error) {
    return err.message || "Passkey registration failed";
  }
  return "Passkey registration failed";
}

/** Maps a WebAuthn error to user-facing passkey sign-in copy. */
export function mapPasskeyWebAuthnError(err: unknown): {
  message: string;
  errorName: string | undefined;
} {
  if (!(err instanceof Error)) {
    return {
      message: "Failed to authenticate with passkey",
      errorName: undefined,
    };
  }

  if (err.name === "NotAllowedError") {
    return { message: "Authentication was canceled", errorName: err.name };
  }
  if (err.name === "AbortError") {
    return { message: "Authentication timed out", errorName: err.name };
  }

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return {
    message: isLocalhost
      ? "No localhost passkey available. Create one for localhost when prompted, or test sign-in on https://helvety.com."
      : "Failed to authenticate with passkey",
    errorName: err.name,
  };
}
