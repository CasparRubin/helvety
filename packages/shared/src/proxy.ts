import { randomBytes } from "crypto";

import { buildCsp } from "@helvety/config/next-headers";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_DOMAIN } from "./config";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSP_NONCE_LENGTH = 16;

/** Options for building the Content-Security-Policy header in the proxy. */
export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
};

/** Configuration for creating a lightweight security proxy handler. */
export type CreateSecurityProxyOptions = {
  /** CSP options (imgBlob, scriptUnsafeEval, workerBlob) */
  buildCspOptions?: BuildCspOptions;
  /** Whether to set x-helvety-url header (default: true). Web gateway uses false. */
  includeHelvetyUrl?: boolean;
  /** Whether to generate CSRF token cookie (default: true). Web gateway uses false. */
  includeCsrf?: boolean;
};

/**
 * Creates a lightweight proxy function for Next.js proxy.ts.
 *
 * DESIGN: This proxy is intentionally optimistic-only (CSP, CSRF, headers).
 * Supabase's default SSR guide recommends proxy-based token refresh; we instead
 * rely on Server Actions and Route Handlers to refresh sessions. Session refresh
 * requires cookie writes, which Server Components cannot do; our createServerClient
 * handles refresh in action/route context. Repository test/policy checks
 * enforce this separation.
 *
 * Config must be exported separately in each app (Next.js requires static config).
 *
 * Use in each app's proxy.ts:
 * ```ts
 * import { createSecurityProxy } from "@helvety/shared/proxy";
 * const proxy = createSecurityProxy({ buildCspOptions: { imgBlob: true } });
 * export { proxy };
 * export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
 * ```
 */
export function createSecurityProxy(options: CreateSecurityProxyOptions = {}) {
  const {
    buildCspOptions = {},
    includeHelvetyUrl = true,
    includeCsrf = true,
  } = options;

  return async function proxy(request: NextRequest) {
    const nonce = randomBytes(CSP_NONCE_LENGTH).toString("base64");
    const csp = buildCsp({ nonce, ...buildCspOptions });

    // NOTE: Header propagation from proxy to Server Components can vary by
    // runtime/version. Treat x-helvety-url and x-nonce as best-effort signals.
    // Auth redirects should rely on explicit currentPath values where available.
    request.headers.set("x-nonce", nonce);
    request.headers.set("Content-Security-Policy", csp);

    if (includeHelvetyUrl) {
      const publicUrl = `${request.nextUrl.origin}${request.nextUrl.basePath}${request.nextUrl.pathname}${request.nextUrl.search}`;
      request.headers.set("x-helvety-url", publicUrl);
    }

    // Proxy remains intentionally lightweight and optimistic-only:
    // no DB hits and no Supabase token refresh work.
    const response = NextResponse.next({
      request: { headers: new Headers(request.headers) },
    });

    if (includeCsrf && !request.cookies.get(CSRF_COOKIE_NAME)?.value) {
      const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
      response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
        ...(process.env.NODE_ENV === "production" && { domain: COOKIE_DOMAIN }),
      });
    }

    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
}
