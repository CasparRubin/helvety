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
  options?: { forceLogin?: boolean }
): string {
  // Determine the redirect URI with validation
  let redirectUri: string;

  if (currentUrl && isValidRedirectUri(currentUrl)) {
    // Use provided URL if it passes validation
    redirectUri = currentUrl;
  } else if (typeof window !== "undefined") {
    // Client-side: use current location, then enforce allowlist validation.
    const windowUrl = window.location.href;
    redirectUri = isValidRedirectUri(windowUrl) ? windowUrl : urls.home;
  } else {
    // Server-side: use home URL
    redirectUri = urls.home;
  }

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
 * Includes an optional redirect_uri parameter for post-logout navigation.
 * Set `global: true` to revoke all refresh tokens.
 *
 * Security: The redirect URI is validated against an allowlist to prevent
 * open redirect attacks. Invalid URIs fall back to the default app URL.
 */
export function getLogoutUrl(
  redirectUri?: string,
  options?: { global?: boolean }
): string {
  // Validate the provided URI; fall back to default if invalid
  const redirect =
    redirectUri && isValidRedirectUri(redirectUri) ? redirectUri : urls.home;
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
