const AUTH_REQUIRED_CODE = "AUTH_REQUIRED";
const AUTH_REQUIRED_MESSAGE = "Not authenticated";

const HARD_LOGOUT_ERROR_TOKENS = [
  "auth_required",
  "not authenticated",
  "security validation failed",
  "session",
  "token",
  "unauthorized",
  "failed to check encryption",
  "failed to get encryption",
  "encryption not unlocked",
  "failed to decrypt",
  "key check",
  "invalid key",
] as const;

/** Builds a machine-readable auth-required error string for action responses. */
export function buildAuthRequiredError(
  message = AUTH_REQUIRED_MESSAGE
): string {
  return `${AUTH_REQUIRED_CODE}:${message}`;
}

/** Checks whether an action error represents an auth-required condition. */
export function isAuthRequiredError(error?: string | null): boolean {
  if (!error) {
    return false;
  }
  return (
    error.startsWith(`${AUTH_REQUIRED_CODE}:`) ||
    error.toLowerCase().includes(AUTH_REQUIRED_MESSAGE.toLowerCase())
  );
}

/** Removes machine-readable prefixes from action errors for UI display/logic. */
export function normalizeActionError(error?: string | null): string | null {
  if (!error) {
    return null;
  }
  if (error.startsWith(`${AUTH_REQUIRED_CODE}:`)) {
    return (
      error.slice(`${AUTH_REQUIRED_CODE}:`.length).trim() ||
      AUTH_REQUIRED_MESSAGE
    );
  }
  return error;
}

/** True when an error should force a full hard logout and fresh auth flow. */
export function shouldForceHardLogout(error?: string | null): boolean {
  if (!error) {
    return false;
  }
  const value = error.toLowerCase();
  return HARD_LOGOUT_ERROR_TOKENS.some((token) => value.includes(token));
}
