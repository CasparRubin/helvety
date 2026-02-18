/**
 * Shared security headers factory for all Helvety Next.js apps.
 *
 * Generates consistent HSTS, COOP, COEP, and other security headers.
 * CSP is generated per-request in proxy.ts with a cryptographic nonce.
 *
 * @param {object} options
 * @param {string} options.appName - App identifier for CSP report logging
 * @returns {import("next").NextConfig["headers"]} Next.js headers function
 */
export function createSecurityHeaders({ appName } = {}) {
  return async function headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    const headersList = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        // Disabled: modern best practice relies on CSP instead.
        // "1; mode=block" is deprecated and can introduce vulnerabilities in older browsers.
        key: "X-XSS-Protection",
        value: "0",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
      },
      {
        key: "Reporting-Endpoints",
        value: `csp="/api/csp-report"`,
      },
      {
        key: "Report-To",
        value: JSON.stringify({
          group: "csp-endpoint",
          max_age: 10886400,
          endpoints: [{ url: "/api/csp-report" }],
        }),
      },
      // CSP is set per-request in proxy.ts with a nonce — not as a static header.
    ];

    // Production-only security headers
    if (!isDevelopment) {
      headersList.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      headersList.push({
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      });
      headersList.push({
        // "credentialless" allows third-party resources (Vercel Analytics, etc.)
        // without requiring Cross-Origin-Resource-Policy headers from them,
        // while still enabling cross-origin isolation benefits.
        key: "Cross-Origin-Embedder-Policy",
        value: "credentialless",
      });
    }

    return [
      {
        source: "/:path*",
        headers: headersList,
      },
    ];
  };
}

/**
 * Builds the Content-Security-Policy header value with a per-request nonce.
 *
 * When a nonce is present, browsers automatically ignore 'unsafe-inline' for
 * script-src. The 'unsafe-inline' fallback is kept so that browsers without
 * nonce support still render the page (graceful degradation).
 *
 * @param {object} opts
 * @param {string} opts.nonce - Cryptographic nonce for this request
 * @param {boolean} [opts.imgBlob=false] - Allow blob: in img-src
 * @param {"always" | "dev-only"} [opts.scriptUnsafeEval="dev-only"] - When to allow 'unsafe-eval'
 * @param {boolean} [opts.workerBlob=false] - Add worker-src 'self' blob:
 * @returns {string}
 */
export function buildCsp({
  nonce,
  imgBlob = false,
  scriptUnsafeEval = "dev-only",
  workerBlob = false,
} = {}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const cspReportEndpoint = "/api/csp-report";

  const useUnsafeEval =
    scriptUnsafeEval === "always" ||
    (scriptUnsafeEval === "dev-only" && isDevelopment);

  const nonceDirective = nonce ? ` 'nonce-${nonce}'` : "";

  const directives = [
    "default-src 'self'",
    `script-src 'self'${useUnsafeEval ? " 'unsafe-eval'" : ""}${nonceDirective} 'unsafe-inline'${workerBlob ? " blob:" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${imgBlob ? " blob:" : ""} https://helvety.com https://*.helvety.com https://*.supabase.co`,
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://va.vercel-scripts.com",
    ...(workerBlob ? ["worker-src 'self' blob:"] : []),
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "script-src-attr 'none'",
    `report-uri ${cspReportEndpoint}`,
    "report-to csp-endpoint",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}
