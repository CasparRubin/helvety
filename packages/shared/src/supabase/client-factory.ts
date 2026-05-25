import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";

import { handleSupabaseCookieWriteFailure } from "./cookie-write-failure";
import { AUTH_REFRESHED_HEADER_NAME } from "./refresh-auth-session-in-proxy";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase server client with cookie handling for Server Components.
 * This is the standard way to create a client in Server Components, Server Actions, etc.
 *
 * Cookies are configured for session sharing in production. Refreshed auth tokens are
 * persisted by `createSecurityProxy` / `refreshSupabaseAuthSession` (or actions/routes).
 * When the proxy set `x-helvety-auth-refreshed`, `setAll` is a no-op in layouts so RSC
 * does not retry disallowed cookie writes; otherwise failed writes log (prod) or throw (dev).
 *
 * @returns Promise that resolves to a Supabase client instance
 */
export async function createServerSupabaseClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const cookieDomain = COOKIE_DOMAIN;
  const skipCookiePersistence =
    headersList.get(AUTH_REFRESHED_HEADER_NAME) === "1";

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
          if (skipCookiePersistence) {
            return;
          }
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
              context: "createServerSupabaseClient.setAll",
            });
          }
        },
      },
    }
  );
}

/** @deprecated Use {@link createServerSupabaseClient}. */
export const createServerComponentClient = createServerSupabaseClient;
