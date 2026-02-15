"use client";

import { logger } from "@helvety/shared/logger";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { getRequiredAuthStep, buildLoginUrl } from "@/lib/auth-utils";

/**
 * Handles auth tokens from URL hash fragments on any page.
 *
 * This component provides a safety net for email verification flows when
 * Supabase redirects to a page other than /auth/callback. Hash fragments
 * (#access_token=...) are not sent to the server, so we handle them client-side.
 *
 * Note: The primary sign-in flow now uses OTP codes (verification codes typed by
 * the user), so this component primarily handles edge cases and legacy flows
 * (account recovery, invite, email change confirmation links).
 *
 * After setting the session, this component checks if the user needs to complete
 * passkey/encryption setup before redirecting to the final destination.
 *
 * Place this component in the root layout to ensure tokens are processed
 * regardless of which page the user lands on.
 */
export function AuthTokenHandler() {
  const router = useRouter();
  const supabase = createBrowserClient();
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

    // Read search params directly from the URL (avoids useSearchParams which
    // requires Suspense and can cause hydration mismatches with Radix IDs)
    const queryParams = new URLSearchParams(window.location.search);
    const rawRedirectUri = queryParams.get("redirect_uri");
    // Validate redirect URI against allowlist to prevent open redirect attacks
    const redirectUri = isValidRedirectUri(rawRedirectUri)
      ? rawRedirectUri
      : null;

    // Set the session from hash tokens
    void (async () => {
      try {
        const { error, data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Clear hash but preserve query params
        const currentUrl = new URL(window.location.href);
        currentUrl.hash = "";
        window.history.replaceState(null, "", currentUrl.toString());

        if (error) {
          logger.error("Failed to set session from hash tokens:", error);
          processingRef.current = false;
          return;
        }

        const user = data.user;
        if (!user) {
          logger.error("Session set but no user found");
          processingRef.current = false;
          return;
        }

        // Check what auth step the user needs to complete
        const { step } = await getRequiredAuthStep(user.id);

        // User needs to complete setup or passkey auth
        const loginUrl = buildLoginUrl(step, redirectUri);
        window.location.href = loginUrl;
      } catch (err) {
        logger.error("Error processing hash tokens:", err);
        processingRef.current = false;
      }
    })();
  }, [router, supabase]);

  return null;
}
