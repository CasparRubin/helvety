"use server";

import "server-only";

import { validateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

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
): Promise<void> {
  try {
    // Enforce CSRF on logout to avoid cross-site forced sign-outs.
    const valid = await validateCSRFToken(csrfToken);
    if (!valid) {
      logger.warn("Logout blocked due to missing/invalid CSRF token");
      return;
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
      return;
    }
  } catch (error) {
    logger.error("Logout error:", error);
  }
}
