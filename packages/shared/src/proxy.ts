import { randomBytes } from "crypto";

import { buildCsp } from "@helvety/config/next-headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_DOMAIN, urls } from "./config";
import { getSupabaseKey, getSupabaseUrl } from "./env-validation";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSP_NONCE_LENGTH = 16;

/** Options for building the Content-Security-Policy header in the proxy. */
export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
};

/** Configuration for creating a session-refreshing proxy handler. */
export type CreateSessionRefreshProxyOptions = {
  /** CSP options (imgBlob, scriptUnsafeEval, workerBlob) */
  buildCspOptions?: BuildCspOptions;
  /** Whether to set x-helvety-url header (default: true). Web gateway uses false. */
  includeHelvetyUrl?: boolean;
  /** Whether to generate CSRF token cookie (default: true). Web gateway uses false. */
  includeCsrf?: boolean;
};

/**
 * Creates a session refresh proxy function for Next.js proxy.ts.
 *
 * Config must be exported separately in each app (Next.js requires static config).
 *
 * Use in each app's proxy.ts:
 * ```ts
 * import { createSessionRefreshProxy } from "@helvety/shared/proxy";
 * const proxy = createSessionRefreshProxy({ buildCspOptions: { imgBlob: true } });
 * export { proxy };
 * export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
 * ```
 */
export function createSessionRefreshProxy(
  options: CreateSessionRefreshProxyOptions = {}
) {
  const {
    buildCspOptions = {},
    includeHelvetyUrl = true,
    includeCsrf = true,
  } = options;

  return async function proxy(request: NextRequest) {
    const nonce = randomBytes(CSP_NONCE_LENGTH).toString("base64");
    const csp = buildCsp({ nonce, ...buildCspOptions });

    // NOTE: In Next.js 16 (proxy.ts), custom request headers set here do NOT
    // reach server components via headers(). The { request: { headers } } pattern
    // is the documented API but does not propagate in practice (16.1.6).
    // CSP is also set as a response header below; x-nonce may resolve to ""
    // in layouts. For auth redirects, requireAuth() accepts a currentPath
    // parameter instead of relying on x-helvety-url.
    request.headers.set("x-nonce", nonce);
    request.headers.set("Content-Security-Policy", csp);

    if (includeHelvetyUrl) {
      const publicUrl = `${urls.home}${request.nextUrl.basePath}${request.nextUrl.pathname}${request.nextUrl.search}`;
      request.headers.set("x-helvety-url", publicUrl);
    }

    const cloneRequestHeaders = () => new Headers(request.headers);

    let supabaseResponse = NextResponse.next({
      request: { headers: cloneRequestHeaders() },
    });

    let supabaseUrl: string;
    let supabaseKey: string;
    try {
      supabaseUrl = getSupabaseUrl();
      supabaseKey = getSupabaseKey();
    } catch {
      supabaseResponse.headers.set("Content-Security-Policy", csp);
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: cloneRequestHeaders() },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              ...(process.env.NODE_ENV === "production" && {
                domain: COOKIE_DOMAIN,
              }),
            };
            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    });

    try {
      await supabase.auth.getClaims();
    } catch {
      // Session refresh failed - continue without refresh
    }

    if (includeCsrf && !request.cookies.get(CSRF_COOKIE_NAME)?.value) {
      const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
      supabaseResponse.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
        ...(process.env.NODE_ENV === "production" && { domain: COOKIE_DOMAIN }),
      });
    }

    supabaseResponse.headers.set("Content-Security-Policy", csp);
    return supabaseResponse;
  };
}
