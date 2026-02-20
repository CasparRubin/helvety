"use client";

import { clearAllKeys } from "@helvety/shared/crypto/key-storage";
import { clearCachedPRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { useCSRFSafe } from "@/hooks/use-csrf";

import { signOutAction } from "./actions";

/**
 * Logout page - clears encryption keys from IndexedDB before signing out.
 *
 * This is a client-side page (not a route handler) so that we can access
 * IndexedDB to clear cached encryption keys before the session is destroyed.
 * Without this, keys would persist in IndexedDB for up to 24 hours after
 * logout, creating a risk on shared devices.
 *
 * Flow:
 * 1. Clear all encryption keys from IndexedDB (master + unit keys)
 * 2. Call server action to sign out Supabase session
 * 3. Redirect to the specified destination (or default)
 *
 * Usage: /logout?redirect_uri=https://helvety.com/pdf
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

    /** Clears IndexedDB keys, signs out, then redirects. */
    async function performLogout() {
      try {
        await clearAllKeys();
        clearCachedPRFSalt();
      } catch {
        // Continue with logout even if key clearing fails
      }

      const globalLogout = searchParams.get("scope") === "global";
      await signOutAction(csrfToken ?? undefined, globalLogout);

      const rawRedirectUri = searchParams.get("redirect_uri");
      const defaultRedirect =
        process.env.NODE_ENV === "production"
          ? "https://helvety.com"
          : `${window.location.origin}/login`;

      const redirectTo =
        rawRedirectUri && isValidRedirectUri(rawRedirectUri)
          ? rawRedirectUri
          : defaultRedirect;

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
