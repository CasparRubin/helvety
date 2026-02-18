"use client";

import { clearAllKeys } from "@helvety/shared/crypto/key-storage";
import { clearCachedPRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React strict mode
    if (hasRun.current) return;
    hasRun.current = true;

    /** Clear encryption keys and sign out the user, then redirect to login. */
    async function performLogout() {
      // Step 1: Clear all encryption keys from IndexedDB and PRF salt cache
      try {
        await clearAllKeys();
        clearCachedPRFSalt();
      } catch {
        // Continue with logout even if key clearing fails
      }

      // Step 2: Sign out server-side (clears session cookies).
      // scope=global revokes ALL sessions across devices.
      const globalLogout = searchParams.get("scope") === "global";
      await signOutAction(globalLogout);

      // Step 3: Redirect to destination
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
  }, [searchParams]);

  // Minimal UI shown briefly during logout
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing out...</p>
    </div>
  );
}
