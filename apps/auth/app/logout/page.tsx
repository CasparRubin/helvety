"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { clearAllKeys } from "@helvety/shared/crypto/key-storage";
import { clearCachedPRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { useCSRFSafe } from "@helvety/ui/csrf-provider";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { signOutAction } from "./actions";

/** Returns true when a redirect target points back to the logout route. */
function isLogoutRedirectTarget(uri: string): boolean {
  try {
    const targetUrl = new URL(uri);
    const authBaseUrl = new URL(urls.auth);
    const authBasePath = authBaseUrl.pathname.replace(/\/$/, "");
    const logoutPath = `${authBasePath}/logout`;
    return (
      targetUrl.origin === authBaseUrl.origin &&
      targetUrl.pathname === logoutPath
    );
  } catch {
    return false;
  }
}

/** Validates and sanitizes post-logout redirects to avoid recursive loops. */
function getSafeLogoutRedirect(
  redirectUri: string | null,
  defaultRedirect: string
): string {
  if (!redirectUri || !isValidRedirectUri(redirectUri)) {
    return defaultRedirect;
  }
  if (isLogoutRedirectTarget(redirectUri)) {
    return defaultRedirect;
  }
  return redirectUri;
}

/**
 * Logout page - clears local encryption artifacts before sign-out.
 *
 * This is a client-side page (not a route handler) so that we can access
 * IndexedDB to clear cached encryption keys before the session is destroyed.
 * Without this, keys could persist on shared devices after logout.
 *
 * Flow:
 * 1. Clear encryption keys from IndexedDB and clear cached PRF salt
 * 2. Call server action to sign out Supabase session (optionally global scope)
 * 3. On sign-out success, redirect to the specified destination (or default)
 * 4. On sign-out failure, route to /auth/login with force_login=1
 *
 * Usage:
 * - /logout?redirect_uri=https://helvety.com/pdf
 * - /logout?redirect_uri=https://helvety.com/tasks&scope=global
 */
export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground text-sm">Signing out...</p>
        </div>
      }
    >
      <LogoutHandler />
    </Suspense>
  );
}

/** Reads redirect params and performs key cleanup + sign-out. */
function LogoutHandler() {
  const searchParams = useSearchParams();
  const csrfToken = useCSRFSafe();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    /** Clears keys, attempts sign-out, then routes safely. */
    async function performLogout() {
      try {
        await clearAllKeys();
        clearCachedPRFSalt();
      } catch {
        // Continue with logout even if key clearing fails
      }

      const globalLogout = searchParams.get("scope") === "global";
      const rawRedirectUri = searchParams.get("redirect_uri");
      const defaultRedirect = urls.home;
      const redirectTo = getSafeLogoutRedirect(rawRedirectUri, defaultRedirect);

      const signOutResult = await signOutAction(
        csrfToken ?? undefined,
        globalLogout
      );
      if (!signOutResult.success) {
        window.location.href = getLoginUrl(redirectTo, { forceLogin: true });
        return;
      }

      window.location.href = redirectTo;
    }

    void performLogout();
  }, [searchParams, csrfToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing out...</p>
    </div>
  );
}
