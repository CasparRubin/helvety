/**
 * Auth redirect utilities for centralized authentication
 *
 * These functions handle redirects to/from the centralized auth service
 * at urls.auth (https://helvety.com/auth in production) for login/logout flows.
 *
 * Security: Redirect URIs passed through these helpers are validated against
 * an allowlist to reduce
 * open redirect attacks.
 */

import { urls } from "./config";
import { getSafeRedirectUri, isValidRedirectUri } from "./redirect-validation";

const AUTH_LOGIN_PATH = `${new URL(urls.auth).pathname.replace(/\/$/, "")}/login`;
const MAX_REDIRECT_UNWRAP_DEPTH = 3;

/** Returns true when the input is a safe absolute-relative path. */
function isRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

/** Converts a path/URL into an absolute URL using the provided origin. */
function toAbsoluteUrl(value: string, origin: string): string | null {
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
}

/** Returns true when the provided URL points to the auth login route. */
function isAuthLoginUrl(url: URL): boolean {
  return url.pathname.replace(/\/$/, "") === AUTH_LOGIN_PATH;
}

/** Best-effort parse of a URL using runtime/browser origin when needed. */
function parseWithBestEffortOrigin(
  value: string,
  runtimeOrigin?: string
): URL | null {
  try {
    if (runtimeOrigin) {
      return new URL(value, runtimeOrigin);
    }
    if (typeof window !== "undefined") {
      return new URL(value, window.location.origin);
    }
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Unwraps redirect_uri when callers accidentally pass an auth login URL.
 * Prevents recursive /auth/login?redirect_uri=/auth/login?... loops.
 */
function unwrapAuthLoginRedirect(
  input: string | undefined,
  runtimeOrigin?: string
): string | undefined {
  if (!input) {
    return input;
  }

  let candidate = input;
  for (let depth = 0; depth < MAX_REDIRECT_UNWRAP_DEPTH; depth += 1) {
    const parsed = parseWithBestEffortOrigin(candidate, runtimeOrigin);
    if (!parsed || !isAuthLoginUrl(parsed)) {
      return candidate;
    }
    const next = parsed.searchParams.get("redirect_uri");
    if (!next) {
      return undefined;
    }
    candidate = next;
  }

  return candidate;
}

/** Resolves a validated redirect target for auth login/logout flows. */
function resolveRedirectUri(
  input: string | undefined,
  runtimeOrigin?: string
): string {
  const normalizedInput = unwrapAuthLoginRedirect(input, runtimeOrigin);
  const safeAbsolute = getSafeRedirectUri(normalizedInput, null);

  if (safeAbsolute) {
    return safeAbsolute;
  }

  if (normalizedInput && isRelativePath(normalizedInput)) {
    if (runtimeOrigin) {
      const absolute = toAbsoluteUrl(normalizedInput, runtimeOrigin);
      const safeAbsoluteFromOrigin = getSafeRedirectUri(absolute, null);
      if (safeAbsoluteFromOrigin) {
        return safeAbsoluteFromOrigin;
      }
    }
    if (typeof window !== "undefined") {
      const absolute = toAbsoluteUrl(normalizedInput, window.location.origin);
      const safeAbsoluteFromWindow = getSafeRedirectUri(absolute, null);
      if (safeAbsoluteFromWindow) {
        return safeAbsoluteFromWindow;
      }
    }
  }

  if (typeof window !== "undefined") {
    const windowUrl = window.location.href;
    return isValidRedirectUri(windowUrl) ? windowUrl : urls.home;
  }

  return urls.home;
}

/**
 * Get the login URL for redirecting to the auth service.
 * Includes the current URL as redirect_uri parameter for post-login return.
 * Optionally appends `force_login=1` so `/auth/login` does not auto-redirect
 * completed sessions back to the app (e.g. after logout, or when EncryptionGate
 * needs a fresh passkey unlock). It does **not** force email OTP; trusted devices
 * still resolve to passkey-first at the auth login gate.
 *
 * Security: The redirect URI is validated against an allowlist to prevent
 * open redirect attacks. Invalid URIs fall back to the default app URL.
 */
export function getLoginUrl(
  currentUrl?: string,
  options?: { forceLogin?: boolean; currentOrigin?: string }
): string {
  const redirectUri = resolveRedirectUri(currentUrl, options?.currentOrigin);

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  });
  if (options?.forceLogin) {
    params.set("force_login", "1");
  }

  return `${urls.auth}/login?${params.toString()}`;
}

/**
 * Get the logout URL for signing out via the auth service.
 * Includes an optional redirect_uri parameter for post-login return after the
 * logout page hands off to /auth/login.
 * Set `global: true` to revoke all refresh tokens.
 *
 * Security: The redirect URI is validated against an allowlist to prevent
 * open redirect attacks. Invalid URIs fall back to the default app URL.
 */
export function getLogoutUrl(
  redirectUri?: string,
  options?: { global?: boolean; currentOrigin?: string }
): string {
  const redirect = resolveRedirectUri(redirectUri, options?.currentOrigin);
  const scopeParam = options?.global ? "&scope=global" : "";

  return `${urls.auth}/logout?redirect_uri=${encodeURIComponent(redirect)}${scopeParam}`;
}

/**
 * Redirect to the login page.
 * Call this from client components when user needs to authenticate.
 * Set `forceLogin: true` when passkey sign-in must not be skipped (logout,
 * EncryptionGate, or any case where `/auth/login` should not auto-redirect).
 * Uses `window.location.href` to navigate to the auth service.
 */
export function redirectToLogin(
  currentUrl?: string,
  options?: { forceLogin?: boolean }
): void {
  if (typeof window !== "undefined") {
    window.location.href = getLoginUrl(currentUrl, options);
  }
}

/**
 * Redirect to logout.
 * Call this from client components to sign out.
 * Navigates to the auth service logout endpoint.
 */
export function redirectToLogout(redirectUri?: string): void {
  if (typeof window !== "undefined") {
    window.location.href = getLogoutUrl(redirectUri);
  }
}

/**
 * Redirect to global logout.
 * Use this when auth/e2ee session state is invalid and all sessions must end.
 */
export function redirectToGlobalLogout(redirectUri?: string): void {
  if (typeof window !== "undefined") {
    window.location.href = getLogoutUrl(redirectUri, { global: true });
  }
}
