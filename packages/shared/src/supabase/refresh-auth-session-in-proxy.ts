import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";
import { logger } from "../logger";

import type { DatabaseSchema } from "../types/database.types";

/**
 * Request header set after the proxy successfully calls `supabase.auth.getUser()`.
 * `createServerComponentClient` reads this via `headers()` and no-ops `setAll` when present.
 */
export const AUTH_REFRESHED_HEADER_NAME = "x-helvety-auth-refreshed";

/**
 * True when the request may include a Supabase browser session cookie (chunked
 * names included). Skips creating a client on fully anonymous hits.
 */
export function requestMayHaveSupabaseAuthCookie(
  request: NextRequest
): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth"));
}

/**
 * Refreshes Supabase auth cookies on the outgoing response and syncs cookie
 * mutations onto `request` for downstream Server Components, per @supabase/ssr
 * guidance for early session refresh at the request edge. Helvety wires this
 * through Next.js `proxy.ts` (not deprecated `middleware.ts`); call `getUser()`
 * early so refresh runs before the response is finalized.
 *
 * @returns The response to return from the proxy (may be replaced when cookies are written).
 */
export async function refreshSupabaseAuthSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  let nextResponse = response;
  const cookieDomain = COOKIE_DOMAIN;

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();

    const supabase = createServerClient<DatabaseSchema, "public">(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            const isRedirect =
              nextResponse.status >= 300 && nextResponse.status < 400;
            if (!isRedirect) {
              nextResponse = NextResponse.next({ request });
            }
            for (const { name, value, options } of cookiesToSet) {
              const merged = {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              };
              nextResponse.cookies.set(name, value, merged);
            }
          },
        },
      }
    );

    await supabase.auth.getUser();
    request.headers.set(AUTH_REFRESHED_HEADER_NAME, "1");
  } catch (error) {
    logger.logUnexpectedError("Supabase session refresh in proxy", error);
  }

  return nextResponse;
}
