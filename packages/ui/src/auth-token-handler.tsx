"use client";

import { urls } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { useEffect, useRef } from "react";

import { forceHardLogout } from "./hard-logout";

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
  const processingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    if (processingRef.current) {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    processingRef.current = true;

    void (async () => {
      try {
        const currentUrl = new URL(window.location.href);
        currentUrl.hash = "";
        window.history.replaceState(null, "", currentUrl.toString());
        await forceHardLogout(`${urls.auth}/login?error=callback_required`);
      } catch (err) {
        logger.error("Error handling legacy hash auth tokens:", err);
        processingRef.current = false;
      }
    })();
  }, []);

  return null;
}
