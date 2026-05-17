import "server-only";

import { createServerComponentClient } from "./client-factory";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This is the standard way to create a client in server-side Next.js code.
 *
 * PERFORMANCE NOTES:
 * - Creates a new client instance per request (required for proper cookie handling)
 * - Each request needs its own cookie context for session management
 * - Client creation is lightweight, so multiple calls within the same action are acceptable
 * - For better performance within a single action, consider reusing the client instance
 *
 * SECURITY NOTES:
 * - This client uses the anon/publishable key (same as client-side)
 * - This client relies on currently configured Row Level Security (RLS) policies
 * - Server-side code can perform additional authorization checks before operations
 * - Use this for server components and server actions that need database access
 * - Session cookie refresh belongs in `proxy.ts` (or route handlers/actions); layouts rely on
 *   `x-helvety-auth-refreshed` from the proxy to avoid RSC cookie writes
 * - Do not use a Supabase secret key (legacy service_role) in this client; it is highly privileged and can bypass RLS where object privileges allow
 *
 * @returns Promise that resolves to a Supabase client instance
 */
export async function createServerClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  return createServerComponentClient();
}
