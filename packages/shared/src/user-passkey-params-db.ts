import "server-only";

import { logger } from "./logger";

import type { UserPasskeyParams } from "./types/entities";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Single read path for `user_passkey_params` by `user_id` (full row).
 * Used by E2EE `encryption-actions` and auth `encryption-actions` so PostgREST
 * handling cannot drift between zones.
 */
export async function fetchUserPasskeyParamsForUser(
  supabase: SupabaseClient,
  userId: string,
  logUnexpectedErrorScope: string
): Promise<{ ok: true; params: UserPasskeyParams | null } | { ok: false }> {
  const { data, error } = await supabase
    .from("user_passkey_params")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { ok: true, params: null };
    }
    logger.logUnexpectedError(logUnexpectedErrorScope, error);
    return { ok: false };
  }

  return { ok: true, params: data as UserPasskeyParams };
}
