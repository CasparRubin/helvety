import "server-only";

import { logger } from "./logger";
import {
  fetchPasskeyParamsForUser as fetchPasskeyParamsClient,
  PASSKEY_PARAMS_SELECT,
} from "./user-passkey-params-client";

import type { UserPasskeyParams } from "./types/entities";
import type { SupabaseClient } from "@supabase/supabase-js";

export { PASSKEY_PARAMS_SELECT };

/**
 * Single read path for `user_passkey_params` by `user_id` (narrow columns).
 * Used by E2EE `encryption-actions` and auth `encryption-actions` so PostgREST
 * handling cannot drift between zones.
 */
export async function fetchUserPasskeyParamsForUser(
  supabase: SupabaseClient,
  userId: string,
  logUnexpectedErrorScope: string
): Promise<{ ok: true; params: UserPasskeyParams | null } | { ok: false }> {
  const result = await fetchPasskeyParamsClient(supabase, userId);

  if (!result.ok) {
    if (result.error.code === "PGRST116") {
      return { ok: true, params: null };
    }
    logger.logUnexpectedError(logUnexpectedErrorScope, result.error);
    return { ok: false };
  }

  return { ok: true, params: result.params };
}
