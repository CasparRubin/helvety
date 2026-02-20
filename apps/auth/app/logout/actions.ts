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
 *                 all devices/browsers (Supabase `scope: "global"`). Use this
 *                 when an account may be compromised.
 */
export async function signOutAction(
  csrfToken?: string,
  global = false
): Promise<{ success: boolean }> {
  try {
    // Best-effort CSRF check — log but don't block logout if missing/invalid,
    // since failing to sign out is worse than a CSRF bypass on logout.
    if (csrfToken) {
      const valid = await validateCSRFToken(csrfToken);
      if (!valid) {
        logger.warn("Logout called with invalid CSRF token");
      }
    }

    const supabase = await createServerClient();
    await supabase.auth.signOut(global ? { scope: "global" } : undefined);
    return { success: true };
  } catch (error) {
    logger.error("Logout error:", error);
    // Return success even on error - we still want to clear the session client-side
    return { success: false };
  }
}
