"use server";

import "server-only";

import { buildAuthRequiredError } from "@helvety/shared/auth-errors";
import { getAuthUser } from "@helvety/shared/auth-retry";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";

import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Return passkey status for the currently authenticated user.
 *
 * Queries `user_auth_credentials` via `createScopedAdminQuery` so results match
 * OTP/callback (`checkUserPasskeyStatus`). The table is not readable through
 * the publishable client alone under current RLS.
 */
export async function getOwnPasskeyStatus(): Promise<
  ActionResponse<{ hasPasskey: boolean; count: number }>
> {
  try {
    const supabase = await createServerClient();
    const { user, error: userError } = await getAuthUser(supabase);
    if (userError || !user) {
      return { success: false, error: buildAuthRequiredError() };
    }

    // user_auth_credentials uses deny-all RLS for client roles; align with
    // checkUserPasskeyStatus (OTP/callback) via scoped admin read.
    const scopedAdmin = createScopedAdminQuery(user.id);
    const { data, error, count } = await scopedAdmin
      .from("user_auth_credentials")
      .select("id", { count: "exact" });

    if (error) {
      logger.logUnexpectedError("Error checking own passkey status", error);
      return { success: false, error: "Failed to check passkey status" };
    }

    const credentialCount = count ?? data?.length ?? 0;
    return {
      success: true,
      data: { hasPasskey: credentialCount > 0, count: credentialCount },
    };
  } catch (error) {
    logger.logUnexpectedError(
      "Unexpected error checking own passkey status",
      error
    );
    return { success: false, error: "Failed to check passkey status" };
  }
}
