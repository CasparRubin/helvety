import { randomBytes } from "crypto";

import { buildCsp } from "@helvety/config/next-headers";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_DOMAIN } from "./config";
import {
  refreshSupabaseAuthSession,
  requestMayHaveSupabaseAuthCookie,
} from "./supabase/refresh-auth-session-in-proxy";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSP_NONCE_LENGTH = 16;

/** Options for building the Content-Security-Policy header in the proxy. */
export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
};

/** Shared matcher used by all app proxies. */
export const SECURITY_PROXY_MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
];

/** Configuration for creating a lightweight security proxy handler. */
export type CreateSecurityProxyOptions = {
  /** CSP options (imgBlob, scriptUnsafeEval, workerBlob) */
  buildCspOptions?: BuildCspOptions;
  /** Whether to set x-helvety-url header (default: true). Public marketing profile disables this. */
  includeHelvetyUrl?: boolean;
  /** Whether to generate CSRF token cookie (default: true). Public marketing profile disables this. */
  includeCsrf?: boolean;
};

/** Canonical proxy profiles used by app-type groupings. */
export type SecurityProxyProfile =
  | "e2ee-app"
  | "auth-gateway"
  | "store-gateway"
  | "public-marketing"
  | "public-tool";

/** Profile presets for createSecurityProxy options. */
export const SECURITY_PROXY_PROFILE_OPTIONS: Record<
  SecurityProxyProfile,
  CreateSecurityProxyOptions
> = {
  "e2ee-app": {
    buildCspOptions: { imgBlob: true },
    includeHelvetyUrl: true,
    includeCsrf: true,
  },
  "auth-gateway": {
    includeHelvetyUrl: true,
    includeCsrf: true,
  },
  "store-gateway": {
    includeHelvetyUrl: true,
    includeCsrf: true,
  },
  "public-marketing": {
    includeHelvetyUrl: false,
    includeCsrf: false,
  },
  "public-tool": {
    buildCspOptions: {
      imgBlob: true,
      scriptUnsafeEval: "dev-only",
      workerBlob: true,
    },
    includeHelvetyUrl: true,
    includeCsrf: true,
  },
};

/**
 * Build the canonical security proxy from a named profile, with optional
 * per-app overrides. Prefer this over calling createSecurityProxy directly
 * in app proxies.
 */
export function createProfiledSecurityProxy(
  profile: SecurityProxyProfile,
  overrides?: Partial<CreateSecurityProxyOptions>
) {
  return createSecurityProxy({
    ...SECURITY_PROXY_PROFILE_OPTIONS[profile],
    ...overrides,
  });
}

/** Redirect direct root requests to the app basePath, if configured. */
export function redirectRootToBasePath(
  request: NextRequest,
  defaultBasePath: string
): NextResponse | null {
  if (new URL(request.url).pathname !== "/") {
    return null;
  }
  const basePath = request.nextUrl.basePath || defaultBasePath;
  return NextResponse.redirect(new URL(basePath, request.url));
}

/** Build a proxy with standardized root/legacy redirects plus shared security proxy. */
export function createAppProxy(options: {
  securityProxy: (request: NextRequest) => Promise<NextResponse>;
  defaultBasePath?: string;
  legacyPathRegexes?: RegExp[];
}) {
  const { securityProxy, defaultBasePath, legacyPathRegexes = [] } = options;

  return async function proxy(request: NextRequest): Promise<NextResponse> {
    if (defaultBasePath) {
      const rootRedirect = redirectRootToBasePath(request, defaultBasePath);
      if (rootRedirect) {
        return rootRedirect;
      }
    }

    const pathname = request.nextUrl.pathname;
    if (legacyPathRegexes.some((regex) => regex.test(pathname))) {
      const basePath = request.nextUrl.basePath || defaultBasePath;
      if (basePath) {
        return NextResponse.redirect(new URL(basePath, request.url));
      }
    }

    return securityProxy(request);
  };
}

/**
 * Creates a lightweight proxy function for Next.js proxy.ts.
 *
 * DESIGN: CSP, CSRF, and headers, plus **Supabase auth cookie refresh** on the
 * same response. Server Components cannot persist refreshed session cookies
 * (`createServerComponentClient` swallows `setAll` in RSC); the proxy runs early
 * enough to call `getUser()` and write `Set-Cookie` per @supabase/ssr guidance.
 * Still no application DB or business logic in the proxy—only Supabase Auth HTTP.
 *
 * Config must be exported separately in each app (Next.js requires static config).
 *
 * Use in each app's proxy.ts (preferred):
 * ```ts
 * import { createAppProxy, createProfiledSecurityProxy } from "@helvety/shared/proxy";
 *
 * export const proxy = createAppProxy({
 *   securityProxy: createProfiledSecurityProxy("e2ee-app"),
 *   defaultBasePath: "/tasks",
 * });
 *
 * export const config = {
 *   matcher: [
 *     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
 *   ],
 * };
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

    let response = NextResponse.next({
      request: { headers: new Headers(request.headers) },
    });

    if (requestMayHaveSupabaseAuthCookie(request)) {
      response = await refreshSupabaseAuthSession(request, response);
    }

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
