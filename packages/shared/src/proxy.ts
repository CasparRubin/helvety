import { buildCsp } from "@helvety/config/next-headers";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_DOMAIN } from "./config";
import { signCookiePayload, verifySignedCookiePayload } from "./cookie-signing";
import {
  refreshSupabaseAuthSession,
  requestMayHaveSupabaseAuthCookie,
} from "./supabase/refresh-auth-session-in-proxy";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;
const CSP_NONCE_LENGTH = 16;
const HEX_CHARACTERS = "0123456789abcdef";
export const CSRF_BOOTSTRAP_HEADER_NAME = "x-csrf-bootstrap-token";

/** Options for building the Content-Security-Policy header in the proxy. */
export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
  /**
   * Adds `'wasm-unsafe-eval'` to script-src. Required for WebAssembly
   * compilation in production when `'unsafe-eval'` is not granted (e.g.
   * onnxruntime-web in the image upscaler).
   */
  wasmUnsafeEval?: boolean;
};

/**
 * Shared matcher for Next.js `proxy.ts` config.
 * Excludes common `public/` static extensions so they are not run through the
 * security proxy (PDF.js worker `.mjs`, ONNX `.mjs`/`.wasm`, JSON, etc.).
 */
export const SECURITY_PROXY_MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
];

/** Configuration for creating a lightweight security proxy handler. */
export type CreateSecurityProxyOptions = {
  /** CSP options (imgBlob, scriptUnsafeEval, workerBlob, wasmUnsafeEval) */
  buildCspOptions?: BuildCspOptions;
  /** Whether to set x-helvety-url header (default: true). Public marketing profile disables this. */
  includeHelvetyUrl?: boolean;
  /** Whether to bootstrap/re-issue signed CSRF cookies (default: true). Public marketing profile disables this. */
  includeCsrf?: boolean;
};

/** Generate cryptographically secure random bytes in edge-safe runtimes. */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** Encode bytes as lowercase hexadecimal. */
function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += HEX_CHARACTERS[(byte >> 4) & 0x0f] ?? "";
    hex += HEX_CHARACTERS[byte & 0x0f] ?? "";
  }
  return hex;
}

/** True when the request carries a CSRF cookie signed with the current secret. */
async function hasValidSignedCsrfCookie(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!cookieValue) {
    return false;
  }

  const unsignedToken = await verifySignedCookiePayload(cookieValue);
  return unsignedToken !== null && /^[0-9a-f]{64}$/i.test(unsignedToken);
}

/** Encode bytes as base64 using web platform APIs. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

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

/** Build a proxy with root → basePath redirect (when set) plus shared security proxy. */
export function createAppProxy(options: {
  securityProxy: (request: NextRequest) => Promise<NextResponse>;
  defaultBasePath?: string;
}) {
  const { securityProxy, defaultBasePath } = options;

  return async function proxy(request: NextRequest): Promise<NextResponse> {
    if (defaultBasePath) {
      const rootRedirect = redirectRootToBasePath(request, defaultBasePath);
      if (rootRedirect) {
        return rootRedirect;
      }
    }

    return securityProxy(request);
  };
}

/**
 * Creates a lightweight proxy function for Next.js proxy.ts.
 *
 * DESIGN: CSP, CSRF, and headers, plus **Supabase auth cookie refresh** on the
 * same response. CSRF bootstrap runs when the cookie is missing or fails
 * signature/format checks under the current `HELVETY_COOKIE_SIGNING_SECRET`
 * (not merely when a cookie name is present). Server Components cannot persist refreshed session cookies
 * (`createServerComponentClient` swallows `setAll` in RSC); the proxy runs early
 * enough to call `getUser()` and write `Set-Cookie` per @supabase/ssr guidance.
 * Still no application DB or business logic in the proxy-only Supabase Auth HTTP.
 *
 * Config must be exported separately in each app (Next.js requires static config).
 *
 * Use in each app's `proxy.ts` (canonical pattern lives on `SECURITY_PROXY_MATCHER`
 * for tests and docs). **Next.js requires `config.matcher` to be a static string
 * literal**, so zone apps must copy the same string into `matcher: [ "…" ]`
 * (see `scripts/check-consistency-guardrails.mjs` for CI parity checks):
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
 *     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
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
    const nonce = toBase64(getRandomBytes(CSP_NONCE_LENGTH));
    const csp = buildCsp({ nonce, ...buildCspOptions });
    const requestHeaders = new Headers(request.headers);
    const existingCsrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    // Re-issue when absent, tampered, or signed with a previous secret.
    const shouldBootstrapCsrf =
      includeCsrf && !(await hasValidSignedCsrfCookie(existingCsrfCookie));
    let bootstrapCsrfToken: string | null = null;
    let signedBootstrapCsrfToken: string | null = null;

    // NOTE: Header propagation from proxy to Server Components can vary by
    // runtime/version. Treat x-helvety-url and x-nonce as best-effort signals.
    // Auth redirects should rely on explicit currentPath values where available.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    if (includeHelvetyUrl) {
      const publicUrl = `${request.nextUrl.origin}${request.nextUrl.basePath}${request.nextUrl.pathname}${request.nextUrl.search}`;
      requestHeaders.set("x-helvety-url", publicUrl);
    }

    if (shouldBootstrapCsrf) {
      bootstrapCsrfToken = toHex(getRandomBytes(CSRF_TOKEN_LENGTH));
      signedBootstrapCsrfToken = await signCookiePayload(bootstrapCsrfToken);
      requestHeaders.set(CSRF_BOOTSTRAP_HEADER_NAME, bootstrapCsrfToken);
    }

    let response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (requestMayHaveSupabaseAuthCookie(request)) {
      response = await refreshSupabaseAuthSession(request, response);
    }

    if (shouldBootstrapCsrf && signedBootstrapCsrfToken) {
      response.cookies.set(CSRF_COOKIE_NAME, signedBootstrapCsrfToken, {
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
