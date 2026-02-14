"use server";

import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Server action to sign out the user's Supabase session.
 * Called from the client-side logout page after encryption keys are cleared.
 */
export async function signOutAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    logger.error("Logout error:", error);
    // Return success even on error - we still want to clear the session client-side
    return { success: false };
  }
}
