import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "../env-validation";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Public tables that are user-owned and intended for user-ID scoping. */
type ScopedTable =
  | "contacts"
  | "entity_links"
  | "items"
  | "link_folders"
  | "links"
  | "notes"
  | "user_auth_credentials"
  | "user_passkey_params"
  | "user_profiles";

const USER_SCOPE_COLUMNS: Record<ScopedTable, "user_id" | "id"> = {
  contacts: "user_id",
  entity_links: "user_id",
  items: "user_id",
  link_folders: "user_id",
  links: "user_id",
  notes: "user_id",
  user_auth_credentials: "user_id",
  user_passkey_params: "user_id",
  user_profiles: "id",
};

/**
 * Forces the owner column on insert/upsert payloads.
 * This prevents missing/incorrect ownership values in scoped write paths.
 */
function withScopeValue<T>(
  table: ScopedTable,
  payload: T | T[],
  userId: string
): T | T[] {
  const scopeColumn = USER_SCOPE_COLUMNS[table];
  const applyScope = (item: T) =>
    ({
      ...(item as object),
      [scopeColumn]: userId,
    }) as T;

  return Array.isArray(payload) ? payload.map(applyScope) : applyScope(payload);
}

/**
 * Get the Supabase secret key from environment (formerly `service_role` JWT).
 * This key is privileged and can bypass RLS where object privileges allow.
 */
function getSupabaseSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. " +
        "This key is required for admin operations like creating sessions. " +
        "Add it to your .env.local file (do not commit this key to git)."
    );
  }
  if (key.length < 40) {
    throw new Error(
      "SUPABASE_SECRET_KEY appears too short. " +
        "Use the secret key (legacy: service_role) from Supabase Dashboard > Project Settings > API."
    );
  }
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (publishableKey && key === publishableKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY must not be the same as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Use the secret key (legacy: service_role) for SUPABASE_SECRET_KEY and the publishable/anon key for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return key;
}

/** Singleton instance of the Supabase admin client */
let adminClient: SupabaseClient<DatabaseSchema> | null = null;

/**
 * Approved `createAdminClient()` call sites (grep-backed; update when adding new uses):
 *
 * - `apps/auth/app/actions/otp-actions.ts` — OTP verify / session bootstrap
 * - `apps/auth/app/actions/passkey-auth-actions.ts` — passkey sign-in (via `lookupCredentialByCredentialId`)
 * - `apps/auth/app/actions/user-lookup.ts` — credential lookup by id/email
 * - `apps/store/app/actions/download-actions.ts` — signed download URLs
 * - `apps/store/lib/packages/resolve-version.ts` — package version resolution
 *
 * Prefer `createScopedAdminQuery(userId)` for user-owned table reads/writes.
 * Use raw `createAdminClient()` only when there is no user context (system flows).
 */

/**
 * Creates or returns the existing Supabase admin client instance.
 * Uses a singleton pattern for efficiency.
 *
 * SECURITY NOTES:
 * - This client uses the Supabase secret key (formerly service_role); treat as highly privileged
 * - It can bypass RLS where object-level privileges allow
 * - ONLY use this for admin operations that require elevated privileges
 * - This client and its operations must not be exposed to the client
 * - Common use cases: creating sessions, looking up credentials by ID
 */
export function createAdminClient(): SupabaseClient<DatabaseSchema> {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseSecretKey = getSupabaseSecretKey();

  adminClient = createClient<DatabaseSchema, "public">(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}

/**
 * Pre-auth passkey sign-in: load a credential row by WebAuthn credential id.
 * No user context exists yet; cannot use `createScopedAdminQuery`.
 */
export async function lookupCredentialByCredentialId(credentialId: string) {
  const admin = createAdminClient();
  return admin
    .from("user_auth_credentials")
    .select("*")
    .eq("credential_id", credentialId)
    .single();
}

/**
 * Returns a scoped admin query helper that applies user ownership filters.
 *
 * SECURITY NOTES:
 * - This is defense-in-depth around the Supabase admin client (SUPABASE_SECRET_KEY; legacy service_role).
 * - SELECT/UPDATE/DELETE/UPSERT paths automatically apply the owner predicate.
 * - INSERT/UPSERT force owner fields on payloads to reduce ownership mismatch risk.
 * - Keep raw createAdminClient() for system flows without a user context (webhooks, public APIs, etc.).
 */
export function createScopedAdminQuery(userId: string) {
  if (!userId) {
    throw new Error("createScopedAdminQuery requires a non-empty userId.");
  }

  const admin = createAdminClient();

  return {
    userId,
    /**
     * Raw admin client - bypasses RLS and has no user-ID scoping.
     * ONLY use for `auth.admin.*` calls (e.g. `deleteUser`, `getUserById`).
     * NEVER use `.from(table)` on this client for user-owned tables;
     * use the scoped `.from()` helper below instead.
     */
    client: admin,
    from(table: ScopedTable) {
      const query = admin.from(table) as ReturnType<
        SupabaseClient<DatabaseSchema>["from"]
      >;
      const scopeColumn = USER_SCOPE_COLUMNS[table];

      return {
        select(columns = "*", options?: Record<string, unknown>) {
          return query.select(columns, options).eq(scopeColumn, userId);
        },
        update(values: Record<string, unknown>) {
          return query.update(values).eq(scopeColumn, userId);
        },
        delete() {
          return query.delete().eq(scopeColumn, userId);
        },
        insert(
          values: Record<string, unknown> | Record<string, unknown>[],
          options?: Record<string, unknown>
        ) {
          return query.insert(withScopeValue(table, values, userId), options);
        },
        upsert(
          values: Record<string, unknown> | Record<string, unknown>[],
          options?: Record<string, unknown>
        ) {
          return query
            .upsert(withScopeValue(table, values, userId), options)
            .eq(scopeColumn, userId);
        },
      };
    },
  };
}
