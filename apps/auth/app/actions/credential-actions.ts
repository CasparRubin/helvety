"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";

import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Return passkey status for the currently authenticated user.
 */
export async function getOwnPasskeyStatus(): Promise<
  ActionResponse<{ hasPasskey: boolean; count: number }>
> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error, count } = await supabase
      .from("user_auth_credentials")
      .select("id", { count: "exact" })
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error checking own passkey status:", error);
      return { success: false, error: "Failed to check passkey status" };
    }

    const credentialCount = count ?? data?.length ?? 0;
    return {
      success: true,
      data: { hasPasskey: credentialCount > 0, count: credentialCount },
    };
  } catch (error) {
    logger.error("Unexpected error checking own passkey status:", error);
    return { success: false, error: "Failed to check passkey status" };
  }
}
