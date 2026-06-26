import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { shouldForceHardLogout } from "../auth-errors";
import { COOKIE_DOMAIN } from "../config";
import { getSupabaseUrl, getSupabaseKey } from "../env-validation";
import { logger } from "../logger";

import { clearSupabaseAuthCookies } from "./clear-supabase-auth-cookies";
import { serverFetchWithTimeout } from "./fetch-with-timeout";

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
   * Reserved for profile wiring (`failClosedOnAuthRefresh`). Definitive refresh
   * failures (revoked or missing refresh token) always clear stale `sb-*` cookies.
   */
  failClosedOnAuthError?: boolean;
}>;

/**
 * Request header set after the proxy persisted refreshed session cookies via `setAll`.
 * `createServerSupabaseClient` reads this via `headers()` and no-ops `setAll` when present.
 */
export const AUTH_REFRESHED_HEADER_NAME = "x-helvety-auth-refreshed";

/** Response headers @supabase/ssr may pass via `setAll` after session refresh. */
export const SUPABASE_AUTH_REFRESH_RESPONSE_HEADERS = [
  "Cache-Control",
  "Pragma",
  "Expires",
] as const;

/** Copy SSR auth-refresh cache headers onto a rebuilt proxy response. */
export function copySupabaseAuthRefreshResponseHeaders(
  from: NextResponse,
  to: NextResponse
): void {
  for (const name of SUPABASE_AUTH_REFRESH_RESPONSE_HEADERS) {
    const value = from.headers.get(name);
    if (value) {
      to.headers.set(name, value);
    }
  }
}

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
  const record = error as {
    message?: string;
    status?: number;
    name?: string;
    code?: string;
  };
  const code = record.code?.toLowerCase() ?? "";
  if (
    code === "refresh_token_not_found" ||
    code === "invalid_refresh_token" ||
    code === "session_not_found"
  ) {
    return true;
  }
  const message = record.message ?? "";
  if (shouldForceHardLogout(message)) {
    return true;
  }
  if (record.status === 401 || record.status === 403) {
    return true;
  }
  return record.name === "AuthSessionMissingError";
}

/** Clears stale Supabase auth cookies after an unrecoverable refresh failure. */
function handleDefinitiveAuthRefreshFailure(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  clearSupabaseAuthCookies(request, response);
  return response;
}

/**
 * Refreshes Supabase auth cookies on the outgoing response and syncs cookie
 * mutations onto `request` for downstream Server Components, per @supabase/ssr
 * guidance for early session refresh at the request edge. When `setAll` receives
 * a second `headers` argument (v0.12+), applies `Cache-Control` / `Pragma` /
 * `Expires` on the outgoing response (including redirects). Helvety wires this
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
  _options: RefreshSupabaseAuthSessionOptions = {}
): Promise<NextResponse> {
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
        global: {
          fetch: serverFetchWithTimeout,
        },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
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
            if (headers) {
              for (const [key, value] of Object.entries(headers)) {
                nextResponse.headers.set(key, value);
              }
            }
          },
        },
      }
    );

    const { error } = await verifyAuthSessionAtProxy(supabase);
    if (error) {
      if (hadAuthCookies && isDefinitiveAuthRefreshFailure(error)) {
        return handleDefinitiveAuthRefreshFailure(request, nextResponse);
      }
      logger.logUnexpectedError("Supabase session refresh in proxy", error);
      return nextResponse;
    }
    if (cookiesWereWritten) {
      request.headers.set(AUTH_REFRESHED_HEADER_NAME, "1");
    }
  } catch (error) {
    if (hadAuthCookies && isDefinitiveAuthRefreshFailure(error)) {
      return handleDefinitiveAuthRefreshFailure(request, nextResponse);
    }
    logger.logUnexpectedError("Supabase session refresh in proxy", error);
  }

  return nextResponse;
}
