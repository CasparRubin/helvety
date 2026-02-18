import { randomBytes } from "crypto";

import { buildCsp } from "@helvety/config/next-headers";
import { COOKIE_DOMAIN, urls } from "./config";
import { getSupabaseKey, getSupabaseUrl } from "./env-validation";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSP_NONCE_LENGTH = 16;

export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
};

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
 * import { createSessionRefreshProxy, defaultMatcher } from "@helvety/shared/proxy";
 * const proxy = createSessionRefreshProxy({ buildCspOptions: { imgBlob: true } });
 * export { proxy };
 * export const config = { matcher: ["/((?!...)$).*)"] };
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
    request.headers.set("x-nonce", nonce);
    request.headers.set("Content-Security-Policy", csp);

    if (includeHelvetyUrl) {
      const publicUrl = `${urls.home}${request.nextUrl.basePath}${request.nextUrl.pathname}${request.nextUrl.search}`;
      request.headers.set("x-helvety-url", publicUrl);
    }

    let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
