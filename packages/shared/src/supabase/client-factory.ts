import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";

import { handleSupabaseCookieWriteFailure } from "./cookie-write-failure";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase server client with cookie handling for Server Components.
 * This is the standard way to create a client in Server Components, Server Actions, etc.
 *
 * Cookies are configured for session sharing in production. Refreshed auth tokens are
 * persisted by `createSecurityProxy` (or actions/routes), not RSC—`setAll` may no-op in layouts.
 *
 * @returns Promise that resolves to a Supabase client instance
 */
export async function createServerComponentClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  const cookieStore = await cookies();
  const cookieDomain = COOKIE_DOMAIN;

  return createServerClient<DatabaseSchema, "public">(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>
        ): void {
          try {
            for (const { name, value, options } of cookiesToSet) {
              const merged = {
                ...(options ?? {}),
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              };
              cookieStore.set(name, value, merged);
            }
          } catch (error) {
            // The `setAll` method can run in a Server Component context where
            // cookies().set() is disallowed by Next.js.
            handleSupabaseCookieWriteFailure({
              error,
              cookieCount: cookiesToSet.length,
              context: "createServerComponentClient.setAll",
            });
          }
        },
      },
    }
  );
}
