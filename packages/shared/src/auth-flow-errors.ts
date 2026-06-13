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

/** User-facing copy when auth is temporarily rate-limited. */
export function rateLimitedAuthUserMessage(): string {
  return "Authentication is temporarily rate-limited. Please wait a few seconds and try again.";
}

/** Maps a rate-limited or raw auth error to user-facing copy. */
export function resolveRateLimitedAuthError(message: string): string {
  if (isRateLimitedAuthMessage(message)) {
    return rateLimitedAuthUserMessage();
  }
  return message;
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
export function mapPasskeyWebAuthnError(
  err: unknown,
  options?: { isLocalhost?: boolean }
): {
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
    options?.isLocalhost ??
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"));

  return {
    message: isLocalhost
      ? "No localhost passkey available. Create one for localhost when prompted, or test sign-in on https://helvety.com."
      : "Failed to authenticate with passkey",
    errorName: err.name,
  };
}
