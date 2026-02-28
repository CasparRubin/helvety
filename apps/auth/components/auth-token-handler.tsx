"use client";

import { urls } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { useEffect, useRef } from "react";

/**
 * Handles legacy hash-fragment auth tokens in a safe way.
 *
 * We do not accept `#access_token` / `#refresh_token` on arbitrary routes
 * anymore. This UI expects auth completion through `/auth/callback` where
 * server-side checks
 * and redirect validation are applied.
 */
export function AuthTokenHandler() {
  const processingRef = useRef(false);

  useEffect(() => {
    // Handle hash fragment tokens that may arrive on any page
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    // Prevent double processing
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
        window.location.href = `${urls.auth}/login?error=callback_required`;
      } catch (err) {
        logger.error("Error handling legacy hash auth tokens:", err);
        processingRef.current = false;
      }
    })();
  }, []);

  return null;
}
