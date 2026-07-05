import type { UserPasskeyParams } from "./types/entities";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/**
 * Narrow select for `user_passkey_params` — crypto metadata only (no `select('*')`).
 * Includes `key_check_value` for wrong-passkey detection on unlock.
 */
export const PASSKEY_PARAMS_SELECT =
  "prf_salt, version, credential_id, key_check_value" as const;

/** Result of loading `user_passkey_params` for unlock. */
export type PasskeyParamsClientResult =
  | { ok: true; params: UserPasskeyParams | null }
  | { ok: false; error: PostgrestError };

/**
 * Browser-safe read of `user_passkey_params` by `user_id`.
 * `PGRST116` (no row) returns `{ ok: true, params: null }`.
 */
export async function fetchPasskeyParamsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<PasskeyParamsClientResult> {
  const { data, error } = await supabase
    .from("user_passkey_params")
    .select(PASSKEY_PARAMS_SELECT)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { ok: true, params: null };
    }
    return { ok: false, error };
  }

  return { ok: true, params: data as UserPasskeyParams };
}
