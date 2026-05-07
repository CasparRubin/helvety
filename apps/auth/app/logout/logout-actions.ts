"use server";

import "server-only";

import { validateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

import { clearChallenge } from "../actions/auth-action-helpers";
import { clearDeviceTrustCookie } from "../actions/device-trust-cookie";

/**
 * Server action to sign out the user's Supabase session.
 * Called from the client-side logout page after encryption keys are cleared.
 *
 * @param csrfToken - CSRF token for request validation (defense-in-depth)
 * @param global - When true, revoke ALL refresh tokens for this user across
 *                 all devices/browsers (Supabase `scope: "global"`). Used by
 *                 strict hard-logout paths when auth/e2ee state is invalid.
 */
export async function signOutAction(
  csrfToken?: string,
  global = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Enforce CSRF on logout to avoid cross-site forced sign-outs.
    const valid = await validateCSRFToken(csrfToken);
    if (!valid) {
      logger.warn("Logout blocked due to missing/invalid CSRF token");
      return { success: false, error: "invalid_csrf" };
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut(
      global ? { scope: "global" } : undefined
    );
    if (error) {
      logger.warn("Logout failed during Supabase signOut", {
        message: error.message,
        status: error.status,
      });
      return { success: false, error: "signout_failed" };
    }

    // Best-effort cleanup of device-local auth artifacts (should not fail logout).
    try {
      await clearDeviceTrustCookie();
    } catch (cookieError) {
      logger.warn("Unable to clear device trust cookie during logout.", {
        message:
          cookieError instanceof Error
            ? cookieError.message
            : String(cookieError),
      });
    }
    try {
      await clearChallenge();
    } catch (challengeError) {
      logger.warn("Unable to clear WebAuthn challenge cookie during logout.", {
        message:
          challengeError instanceof Error
            ? challengeError.message
            : String(challengeError),
      });
    }
    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Logout error", error);
    return { success: false, error: "unexpected_error" };
  }
}
