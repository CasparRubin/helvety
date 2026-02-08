"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Handles auth tokens from URL hash fragments on any page.
 *
 * This component provides a safety net for email verification flows when
 * Supabase redirects to a page other than /auth/callback. Hash fragments
 * (#access_token=...) are not sent to the server, so we handle them
 * client-side. Primarily handles edge cases and legacy flows (password reset,
 * invite, email change confirmation links).
 *
 * Place this component in the root layout to ensure tokens are processed
 * regardless of which page the user lands on.
 */
export function AuthTokenHandler() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Handle hash fragment tokens that may arrive on any page
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    // Set the session from hash tokens
    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error }) => {
        // Clear hash to avoid confusion and prevent re-processing
        window.history.replaceState(null, "", window.location.pathname);

        if (!error) {
          // Refresh to apply the new session
          router.refresh();
        }
      });
  }, [router, supabase]);

  return null;
}
