import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";

import { handleSupabaseCookieWriteFailure } from "./cookie-write-failure";
import { AUTH_REFRESHED_HEADER_NAME } from "./refresh-auth-session-in-proxy";

import type { DatabaseSchema } from "../types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Cookie tuple passed to Supabase SSR `setAll`. */
type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/** Options for {@link buildServerSupabaseClient}. */
type CreateServerSupabaseClientOptions = Readonly<{
  /** When true, never skip `setAll` (route handlers / server actions that mutate sessions). */
  allowCookieWrites?: boolean;
}>;

/** Internal factory for read-only and mutating server Supabase clients. */
async function buildServerSupabaseClient(
  options: CreateServerSupabaseClientOptions = {}
): Promise<SupabaseClient<DatabaseSchema>> {
  const { allowCookieWrites = false } = options;
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const cookieDomain = COOKIE_DOMAIN;
  const skipCookiePersistence =
    !allowCookieWrites && headersList.get(AUTH_REFRESHED_HEADER_NAME) === "1";

  return createServerClient<DatabaseSchema, "public">(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]): void {
          if (skipCookiePersistence) {
            return;
          }
          try {
            for (const {
              name,
              value,
              options: cookieOptions,
            } of cookiesToSet) {
              const merged = {
                ...(cookieOptions ?? {}),
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              };
              cookieStore.set(name, value, merged);
            }
          } catch (error) {
            handleSupabaseCookieWriteFailure({
              error,
              cookieCount: cookiesToSet.length,
              context: allowCookieWrites
                ? "createServerMutatingSupabaseClient.setAll"
                : "createServerSupabaseClient.setAll",
            });
          }
        },
      },
    }
  );
}

/**
 * Supabase client for Server Components and read-mostly server code.
 * When the proxy persisted refreshed cookies and set `x-helvety-auth-refreshed`,
 * `setAll` is a no-op so RSC does not retry disallowed cookie writes.
 */
export async function createServerSupabaseClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  return buildServerSupabaseClient();
}

/**
 * Supabase client for route handlers and server actions that create, refresh,
 * or clear auth sessions (`exchangeCodeForSession`, `verifyOtp`, `signOut`, `updateUser`, etc.).
 * Always persists cookie writes even when the proxy already refreshed the session.
 */
export async function createServerMutatingSupabaseClient(): Promise<
  SupabaseClient<DatabaseSchema>
> {
  return buildServerSupabaseClient({ allowCookieWrites: true });
}
