"use client";

import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Handles auth tokens from URL hash fragments on any page.
 *
 * Safety net for email verification flows when Supabase redirects
 * with hash fragments (#access_token=...) instead of query params.
 * Place in the root layout to ensure tokens are processed
 * regardless of which page the user lands on.
 */
export function AuthTokenHandler() {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error }) => {
        window.history.replaceState(null, "", window.location.pathname);

        if (!error) {
          router.refresh();
        }
      });
  }, [router, supabase]);

  return null;
}
