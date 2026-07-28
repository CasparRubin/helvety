import { buildCsp } from "@helvety/config/next-headers";
import { NextResponse, type NextRequest } from "next/server";

const CSP_NONCE_LENGTH = 16;
/** Request pathname forwarded from the security proxy for gateway shell layout routing. */
export const HELVETY_PATHNAME_HEADER_NAME = "x-helvety-pathname";

/** Options for building the Content-Security-Policy header in the proxy. */
export type BuildCspOptions = {
  imgBlob?: boolean;
  scriptUnsafeEval?: "always" | "dev-only";
  workerBlob?: boolean;
  /** Next.js zone base path for CSP report-uri (defaults from request when omitted). */
  basePath?: string;
  /**
   * Adds `'wasm-unsafe-eval'` to script-src. Required for WebAssembly
   * compilation in production when `'unsafe-eval'` is not granted.
   */
  wasmUnsafeEval?: boolean;
  /** Allow Google Fonts CDN in CSP style-src (optional; prefer self-hosted icon fonts when possible). */
  googleFonts?: boolean;
};

/**
 * Shared matcher for Next.js `proxy.ts` config.
 * Excludes common `public/` static extensions so they are not run through the
 * security proxy (PDF.js worker `.mjs`, Tesseract `.mjs`/`.wasm`, JSON, etc.).
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
  /** Whether to set {@link HELVETY_PATHNAME_HEADER_NAME} (default: false). */
  includeRequestPathname?: boolean;
};

/** Generate cryptographically secure random bytes in edge-safe runtimes. */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
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
  "store-gateway" | "public-marketing" | "public-tool";

/** Profile presets for createSecurityProxy options. */
export const SECURITY_PROXY_PROFILE_OPTIONS: Record<
  SecurityProxyProfile,
  CreateSecurityProxyOptions
> = {
  "store-gateway": {
    includeHelvetyUrl: true,
  },
  "public-marketing": {
    includeHelvetyUrl: false,
  },
  "public-tool": {
    buildCspOptions: {
      imgBlob: true,
      scriptUnsafeEval: "dev-only",
      workerBlob: true,
    },
    includeHelvetyUrl: true,
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

/**
 * Build a proxy with root → basePath redirect (when set) plus shared security proxy.
 *
 * When `defaultBasePath` is set and the request pathname is `/`, redirects to the
 * zone base path.
 */
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
 * DESIGN: CSP and request headers only. No cookie signing, session refresh,
 * application DB, or business logic.
 *
 * Config must be exported separately in each app (Next.js requires static config).
 *
 * Use in each app's `proxy.ts` (canonical pattern lives on `SECURITY_PROXY_MATCHER`
 * for tests and docs). **Next.js requires `config.matcher` to be a static string
 * literal**, so zone apps must copy the same string into `matcher: [ "…" ]`
 * (see `scripts/check-consistency-guardrails.mjs` for matcher parity checks in `ci:check`):
 * ```ts
 * import { createAppProxy, createProfiledSecurityProxy } from "@helvety/shared/proxy";
 *
 * export const proxy = createAppProxy({
 *   securityProxy: createProfiledSecurityProxy("public-tool"),
 *   defaultBasePath: "/pdf",
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
    includeRequestPathname = false,
  } = options;

  return async function proxy(request: NextRequest) {
    const nonce = toBase64(getRandomBytes(CSP_NONCE_LENGTH));
    const csp = buildCsp({
      ...buildCspOptions,
      nonce,
      basePath: buildCspOptions.basePath ?? request.nextUrl.basePath,
    });
    const requestHeaders = new Headers(request.headers);

    // NOTE: Header propagation from proxy to Server Components can vary by
    // runtime/version. Treat x-helvety-url and x-nonce as best-effort signals.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    if (includeHelvetyUrl) {
      const publicUrl = `${request.nextUrl.origin}${request.nextUrl.basePath}${request.nextUrl.pathname}${request.nextUrl.search}`;
      requestHeaders.set("x-helvety-url", publicUrl);
    }

    if (includeRequestPathname) {
      requestHeaders.set(
        HELVETY_PATHNAME_HEADER_NAME,
        request.nextUrl.pathname
      );
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
}
