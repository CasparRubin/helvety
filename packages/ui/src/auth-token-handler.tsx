"use client";

import { urls } from "@helvety/shared/config";
import { useEffect } from "react";

/**
 * Handles legacy hash-fragment auth tokens in a safe way.
 *
 * We no longer accept raw hash tokens on arbitrary pages because they are not
 * state-bound and can be abused for session swapping/login CSRF.
 * This UI expects auth completion through `/auth/callback` using query
 * parameters (PKCE or token_hash).
 *
 * If legacy hash tokens are detected, this handler clears the fragment and
 * redirects the user to the auth app login screen with a safe error.
 */
export function AuthTokenHandler() {
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

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanUrl);
    // Enforce callback-only auth completion.
    window.location.href = `${urls.auth}/login?error=callback_required`;
  }, []);

  return null;
}
