const AUTH_REQUIRED_CODE = "AUTH_REQUIRED";
const AUTH_HARD_LOGOUT_CODE = "AUTH_HARD_LOGOUT";
const AUTH_REQUIRED_MESSAGE = "Not authenticated";
const AUTH_HARD_LOGOUT_MESSAGE = "Authentication state is invalid";

const HARD_LOGOUT_ERROR_TOKENS = [
  "auth_hard_logout",
  "session is invalid",
  "session has been revoked",
  "refresh token not found",
  "invalid refresh token",
  "refresh token is invalid",
] as const;

const LOGIN_ONLY_ERROR_TOKENS = [
  "not authenticated",
  "unauthorized",
  "jwt expired",
] as const;

const RETRYABLE_TRANSPORT_ERROR_TOKENS = [
  "fetch failed",
  "network",
  "load failed",
  "timed out",
  "timeout",
  "connection",
  "econnrefused",
  "enotfound",
  "etimedout",
] as const;

/** Machine-readable action auth error prefixes used across app/server boundaries. */
type AuthActionErrorCode =
  | typeof AUTH_REQUIRED_CODE
  | typeof AUTH_HARD_LOGOUT_CODE;

/** Parsed action error with optional machine code and normalized message body. */
interface ParsedActionError {
  code: AuthActionErrorCode | null;
  message: string;
}

/** Parses prefixed action errors into a stable code/message shape. */
function parseActionError(error?: string | null): ParsedActionError | null {
  if (!error) {
    return null;
  }

  if (error.startsWith(`${AUTH_REQUIRED_CODE}:`)) {
    return {
      code: AUTH_REQUIRED_CODE,
      message: error.slice(`${AUTH_REQUIRED_CODE}:`.length).trim(),
    };
  }

  if (error.startsWith(`${AUTH_HARD_LOGOUT_CODE}:`)) {
    return {
      code: AUTH_HARD_LOGOUT_CODE,
      message: error.slice(`${AUTH_HARD_LOGOUT_CODE}:`.length).trim(),
    };
  }

  return { code: null, message: error.trim() };
}

/** Returns true when the value contains any token in the list. */
function includesAnyToken(value: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

/** Builds a machine-readable auth-required error string for action responses. */
export function buildAuthRequiredError(
  message = AUTH_REQUIRED_MESSAGE
): string {
  return `${AUTH_REQUIRED_CODE}:${message}`;
}

/** Builds a machine-readable hard-logout error string for action responses. */
export function buildAuthHardLogoutError(
  message = AUTH_HARD_LOGOUT_MESSAGE
): string {
  return `${AUTH_HARD_LOGOUT_CODE}:${message}`;
}

/** Checks whether an action error represents an auth-required condition. */
export function isAuthRequiredError(error?: string | null): boolean {
  const parsed = parseActionError(error);
  if (!parsed) {
    return false;
  }

  if (parsed.code === AUTH_REQUIRED_CODE) {
    return true;
  }

  const value = parsed.message.toLowerCase();
  return includesAnyToken(value, LOGIN_ONLY_ERROR_TOKENS);
}

/** Removes machine-readable prefixes from action errors for UI display/logic. */
export function normalizeActionError(error?: string | null): string | null {
  const parsed = parseActionError(error);
  if (!parsed) {
    return null;
  }

  if (parsed.code === AUTH_REQUIRED_CODE) {
    return parsed.message || AUTH_REQUIRED_MESSAGE;
  }

  if (parsed.code === AUTH_HARD_LOGOUT_CODE) {
    return parsed.message || AUTH_HARD_LOGOUT_MESSAGE;
  }

  return parsed.message;
}

/** Navigation intent used by client redirect orchestration. */
type AuthNavigationIntent = "none" | "login" | "hard_logout";

/** Classifies auth-related action errors into navigation intent. */
export function classifyActionAuthError(
  rawError?: string | null
): AuthNavigationIntent {
  const parsed = parseActionError(rawError);
  if (!parsed) {
    return "none";
  }

  if (parsed.code === AUTH_HARD_LOGOUT_CODE) {
    return "hard_logout";
  }

  if (parsed.code === AUTH_REQUIRED_CODE) {
    return "login";
  }

  const value = parsed.message.toLowerCase();
  if (includesAnyToken(value, HARD_LOGOUT_ERROR_TOKENS)) {
    return "hard_logout";
  }

  if (includesAnyToken(value, LOGIN_ONLY_ERROR_TOKENS)) {
    return "login";
  }

  return "none";
}

/** True when an error should force a full hard logout and fresh auth flow. */
export function shouldForceHardLogout(error?: string | null): boolean {
  return classifyActionAuthError(error) === "hard_logout";
}

/** Normalizes an unknown auth error into a lowercase message for classification. */
function normalizeAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }
  const record = error as { message?: string };
  return (record.message ?? "").toLowerCase();
}

/** Reads an HTTP status from a Supabase auth error object when present. */
function getAuthErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const record = error as { status?: number };
  return typeof record.status === "number" ? record.status : undefined;
}

/** Reads the error name from a Supabase auth error or thrown value. */
function getAuthErrorName(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }
  const record = error as { name?: string };
  return record.name ?? "";
}

/**
 * True when an auth API failure is a transient transport error worth retrying.
 *
 * Definitive auth failures (invalid session, expired JWT, revoked refresh token)
 * are never retryable. Use this to distinguish "cannot reach Supabase right now"
 * from "session is dead".
 */
export function isRetryableAuthTransportError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message = normalizeAuthErrorMessage(error);

  if (includesAnyToken(message, HARD_LOGOUT_ERROR_TOKENS)) {
    return false;
  }
  if (includesAnyToken(message, LOGIN_ONLY_ERROR_TOKENS)) {
    return false;
  }

  const name = getAuthErrorName(error);
  if (name === "AuthRetryableFetchError" || name === "AbortError") {
    return true;
  }

  const status = getAuthErrorStatus(error);
  if (status === 0) {
    return true;
  }
  if (status !== undefined && status >= 500) {
    return true;
  }
  if (status === 401 || status === 403) {
    return false;
  }

  return includesAnyToken(message, RETRYABLE_TRANSPORT_ERROR_TOKENS);
}
