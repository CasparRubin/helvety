"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { clearAllKeys } from "@helvety/shared/crypto/key-storage";
import { clearCachedPRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { useCSRFSafe } from "@helvety/ui/csrf-provider";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { signOutAction } from "./logout-actions";

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
 * 3. Route to /auth/login with force_login=1 and redirect_uri preserved (trusted
 *    devices may still start at passkey sign-in without re-entering email)
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
      const redirectTarget =
        rawRedirectUri != null
          ? (getSafeRedirectUri(rawRedirectUri, defaultRedirect) ??
            defaultRedirect)
          : defaultRedirect;
      const loginUrl = getLoginUrl(redirectTarget, { forceLogin: true });
      const signOutResult = await signOutAction(
        csrfToken ?? undefined,
        globalLogout
      );
      const destination = signOutResult.success
        ? loginUrl
        : `${loginUrl}&error=logout_failed`;
      window.location.href = destination;
    }

    void performLogout();
  }, [searchParams, csrfToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing out...</p>
    </div>
  );
}
