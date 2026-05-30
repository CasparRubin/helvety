import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { shouldForceHardLogout } from "../auth-errors";
import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";
import { logger } from "../logger";

import { clearSupabaseAuthCookies } from "./clear-supabase-auth-cookies";

import type { DatabaseSchema } from "../types/database.types";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies/refreshes the session at the proxy edge via `getClaims()` (Supabase
 * Next.js SSR). App authorization still uses `getUser()` in Server Components
 * and actions — never `getSession()`.
 */
async function verifyAuthSessionAtProxy(
  supabase: SupabaseClient<DatabaseSchema>
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.getClaims();
  return { error: error ?? null };
}

/** Options for {@link refreshSupabaseAuthSession}. */
export type RefreshSupabaseAuthSessionOptions = Readonly<{
  /**
   * When true and the request had session cookies, clear invalid `sb-*` cookies
   * on definitive auth failures instead of leaving a stale session.
   */
  failClosedOnAuthError?: boolean;
}>;

/**
 * Request header set after the proxy persisted refreshed session cookies via `setAll`.
 * `createServerSupabaseClient` reads this via `headers()` and no-ops `setAll` when present.
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

/** True when a stale or revoked session cookie should be cleared at the edge. */
function isDefinitiveAuthRefreshFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { message?: string; status?: number; name?: string };
  const message = record.message ?? "";
  if (shouldForceHardLogout(message)) {
    return true;
  }
  if (record.status === 401 || record.status === 403) {
    return true;
  }
  return record.name === "AuthSessionMissingError";
}

/**
 * Refreshes Supabase auth cookies on the outgoing response and syncs cookie
 * mutations onto `request` for downstream Server Components, per @supabase/ssr
 * guidance for early session refresh at the request edge. Helvety wires this
 * through Next.js `proxy.ts` (not deprecated `middleware.ts`). Uses
 * {@link verifyAuthSessionAtProxy} (`getClaims()` at the edge; authorization
 * elsewhere uses `getUser()`) so refresh runs before the
 * response is finalized. See Supabase Next.js SSR guide.
 *
 * @returns The response to return from the proxy (may be replaced when cookies are written).
 */
export async function refreshSupabaseAuthSession(
  request: NextRequest,
  response: NextResponse,
  options: RefreshSupabaseAuthSessionOptions = {}
): Promise<NextResponse> {
  const { failClosedOnAuthError = false } = options;
  let nextResponse = response;
  const cookieDomain = COOKIE_DOMAIN;
  const hadAuthCookies = requestMayHaveSupabaseAuthCookie(request);

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    let cookiesWereWritten = false;

    const supabase = createServerClient<DatabaseSchema, "public">(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            if (cookiesToSet.length > 0) {
              cookiesWereWritten = true;
            }
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

    const { error } = await verifyAuthSessionAtProxy(supabase);
    if (error) {
      if (
        failClosedOnAuthError &&
        hadAuthCookies &&
        isDefinitiveAuthRefreshFailure(error)
      ) {
        clearSupabaseAuthCookies(request, nextResponse);
        return nextResponse;
      }
      logger.logUnexpectedError("Supabase session refresh in proxy", error);
      return nextResponse;
    }
    if (cookiesWereWritten) {
      request.headers.set(AUTH_REFRESHED_HEADER_NAME, "1");
    }
  } catch (error) {
    if (
      failClosedOnAuthError &&
      hadAuthCookies &&
      isDefinitiveAuthRefreshFailure(error)
    ) {
      clearSupabaseAuthCookies(request, nextResponse);
      return nextResponse;
    }
    logger.logUnexpectedError("Supabase session refresh in proxy", error);
  }

  return nextResponse;
}
