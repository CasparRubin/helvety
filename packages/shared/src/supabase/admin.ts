import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "../env-validation";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Public tables that are user-owned and intended for user-ID scoping. */
type ScopedTable =
  | "attachment_audit_logs"
  | "consent_events"
  | "contacts"
  | "entity_contact_links"
  | "item_attachments"
  | "items"
  | "licensed_tenants"
  | "purchases"
  | "spaces"
  | "subscriptions"
  | "units"
  | "user_auth_credentials"
  | "user_passkey_params"
  | "user_profiles";

const USER_SCOPE_COLUMNS: Record<ScopedTable, "user_id" | "id"> = {
  attachment_audit_logs: "user_id",
  consent_events: "user_id",
  contacts: "user_id",
  entity_contact_links: "user_id",
  item_attachments: "user_id",
  items: "user_id",
  licensed_tenants: "user_id",
  purchases: "user_id",
  spaces: "user_id",
  subscriptions: "user_id",
  units: "user_id",
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
 * Get the service role key from environment.
 * This key has full access to the database, bypassing RLS.
 */
function getServiceRoleKey(): string {
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
      "SUPABASE_SECRET_KEY appears too short to be a valid service role key. " +
        "Ensure you are using the service_role key from Supabase Dashboard > Project Settings > API."
    );
  }
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (publishableKey && key === publishableKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY must not be the same as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Use the service_role key for SUPABASE_SECRET_KEY and the anon/public key for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return key;
}

/** Singleton instance of the Supabase admin client */
let adminClient: SupabaseClient<DatabaseSchema> | null = null;

/**
 * Creates or returns the existing Supabase admin client instance.
 * Uses a singleton pattern for efficiency.
 *
 * SECURITY NOTES:
 * - This client uses the SERVICE ROLE key which bypasses RLS
 * - ONLY use this for admin operations that require elevated privileges
 * - This client and its operations must not be exposed to the client
 * - Common use cases: creating sessions, looking up credentials by ID
 */
export function createAdminClient(): SupabaseClient<DatabaseSchema> {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  adminClient = createClient<DatabaseSchema, "public">(
    supabaseUrl,
    serviceRoleKey,
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
 * Returns a scoped admin query helper that applies user ownership filters.
 *
 * SECURITY NOTES:
 * - This is defense-in-depth around the service-role client.
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
    client: admin,
    from(table: ScopedTable) {
      const query = admin.from(table as never) as ReturnType<
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
