/**
 * Re-export common Supabase types so zone apps do not depend on
 * `@supabase/supabase-js` directly for type-only imports.
 */
export type {
  AuthError,
  EmailOtpType,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
