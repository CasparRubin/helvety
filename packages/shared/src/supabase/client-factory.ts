import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";
import { logger } from "../logger";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase server client with cookie handling for Server Components.
 * This is the standard way to create a client in Server Components, Server Actions, etc.
 *
 * Cookies are configured for session sharing in production.
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
          } catch {
            // The `setAll` method was called from a Server Component.
            // cookies().set() is not allowed there, so the cookie update is
            // skipped; the request still uses the existing session from the proxy.
            logger.warn(
              "Supabase cookie write skipped in createServerComponentClient (likely Server Component context). Session refresh may require proxy/action context."
            );
          }
        },
      },
    }
  );
}
