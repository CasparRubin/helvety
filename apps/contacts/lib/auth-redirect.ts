/**
 * Auth redirect utilities for centralized authentication (contacts app).
 *
 * These functions handle redirects to/from the centralized auth service
 * at helvety.com/auth for login and logout flows.
 *
 * Security: All redirect URIs are validated against an allowlist to prevent
 * open redirect attacks.
 */

import { urls } from "@helvety/shared/config";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";

/**
 * Get the login URL for redirecting to the auth service.
 * Includes the current URL as redirect_uri parameter for post-login return.
 *
 * Security: The redirect URI is validated against an allowlist to prevent
 * open redirect attacks. Invalid URIs fall back to the contacts app URL.
 */
export function getLoginUrl(currentUrl?: string): string {
  // Determine the redirect URI with validation
  let redirectUri: string;

  if (currentUrl && isValidRedirectUri(currentUrl)) {
    redirectUri = currentUrl;
  } else if (typeof window !== "undefined") {
    const windowUrl = window.location.href;
    redirectUri = isValidRedirectUri(windowUrl) ? windowUrl : urls.contacts;
  } else {
    redirectUri = urls.contacts;
  }

  return `${urls.auth}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Get the logout URL for signing out via the auth service.
 * Includes an optional redirect_uri parameter for post-logout navigation.
 *
 * Security: The redirect URI is validated against an allowlist to prevent
 * open redirect attacks. Invalid URIs fall back to the contacts app URL.
 */
export function getLogoutUrl(redirectUri?: string): string {
  const redirect =
    redirectUri && isValidRedirectUri(redirectUri)
      ? redirectUri
      : urls.contacts;

  return `${urls.auth}/logout?redirect_uri=${encodeURIComponent(redirect)}`;
}

/**
 * Redirect to the login page.
 * Call this from client components when user needs to authenticate.
 * Uses window.location.href to navigate to the auth service.
 */
export function redirectToLogin(currentUrl?: string): void {
  if (typeof window !== "undefined") {
    window.location.href = getLoginUrl(currentUrl);
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
