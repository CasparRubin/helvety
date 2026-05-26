import "server-only";

import {
  createServerMutatingSupabaseClient,
  createServerSupabaseClient,
} from "./client-factory";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for Server Components and read-mostly server code.
 * Session refresh is handled in `proxy.ts`; this client no-ops `setAll` when
 * `x-helvety-auth-refreshed` is present so RSC does not retry disallowed writes.
 *
 * For route handlers and server actions that mutate auth sessions, use
 * {@link createServerMutatingClient} instead.
 */
export async function createServerClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  return createServerSupabaseClient();
}

/**
 * Creates a Supabase client for route handlers and server actions that persist
 * auth cookies (`exchangeCodeForSession`, `verifyOtp`, `signOut`, `updateUser`, etc.).
 * Always writes cookies even when `x-helvety-auth-refreshed` is present.
 */
export async function createServerMutatingClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  return createServerMutatingSupabaseClient();
}
