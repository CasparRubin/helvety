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
import { isValidRedirectUri } from "./redirect-validation";

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

/** Resolves a validated redirect target for auth login/logout flows. */
function resolveRedirectUri(
  input: string | undefined,
  runtimeOrigin?: string
): string {
  if (input && isValidRedirectUri(input)) {
    return input;
  }

  if (input && isRelativePath(input)) {
    if (runtimeOrigin) {
      const absolute = toAbsoluteUrl(input, runtimeOrigin);
      if (absolute && isValidRedirectUri(absolute)) {
        return absolute;
      }
    }
    if (typeof window !== "undefined") {
      const absolute = toAbsoluteUrl(input, window.location.origin);
      if (absolute && isValidRedirectUri(absolute)) {
        return absolute;
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
 * Optionally appends force_login=1 to suppress auto-return behavior.
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
 * Set forceLogin=true when the login UI must be shown explicitly.
 * Uses window.location.href to navigate to the auth service.
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
