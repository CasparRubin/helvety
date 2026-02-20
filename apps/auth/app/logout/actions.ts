"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

/**
 * Server action to sign out the user's Supabase session.
 * Called from the client-side logout page after encryption keys are cleared.
 *
 * @param global - When true, revoke ALL refresh tokens for this user across
 *                 all devices/browsers (Supabase `scope: "global"`). Use this
 *                 when an account may be compromised.
 */
export async function signOutAction(
  global = false
): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut(global ? { scope: "global" } : undefined);
    return { success: true };
  } catch (error) {
    logger.error("Logout error:", error);
    // Return success even on error - we still want to clear the session client-side
    return { success: false };
  }
}
