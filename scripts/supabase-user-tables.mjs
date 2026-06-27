/**
 * Public tables holding user data. Each must exist in generated types and have
 * forced RLS with owner-scoped policies in production.
 *
 * Shared by `check-supabase-schema-expectations.mjs` (generated types) and
 * `check-supabase-rls-export.mjs` (local `supabase/supabase.json` export).
 */
export const TABLES_REQUIRING_USER_RLS = [
  "contacts",
  "items",
  "notes",
  "links",
  "link_folders",
  "entity_links",
  "user_profiles",
  "user_passkey_params",
  "user_auth_credentials",
];

/** Ownership column per table (defaults to `user_id`). */
export const TABLE_OWNER_COLUMNS = {
  user_profiles: "id",
};
