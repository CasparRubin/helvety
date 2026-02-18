/**
 * Shared security headers factory for all Helvety Next.js apps.
 *
 * Generates consistent CSP, HSTS, COOP, COEP, and other security headers.
 * Each app calls this with a small options object to customize CSP directives.
 *
 * SECURITY NOTE — `'unsafe-inline'` in script-src:
 * This is required because JSON-LD `<script>` tags use dangerouslySetInnerHTML.
 * To remove it, implement per-request nonces: generate a nonce in each app's
 * proxy.ts, pass it via an `x-nonce` header, include it in the CSP as
 * `'nonce-<value>'`, and apply it to all `<Script>` / inline `<script>` tags.
 * When a nonce is present, modern browsers ignore `'unsafe-inline'`.
 *
 * @param {object} options
 * @param {string} options.appName - App identifier for CSP report logging
 * @param {boolean} [options.imgBlob=false] - Allow blob: in img-src (for decrypted previews)
 * @param {"always" | "dev-only"} [options.scriptUnsafeEval="dev-only"] - When to allow 'unsafe-eval' in script-src
 * @param {boolean} [options.workerBlob=false] - Add worker-src 'self' blob: (for PDF.js web workers)
 * @returns {import("next").NextConfig["headers"]} Next.js headers function
 */
export function createSecurityHeaders({
  appName,
  imgBlob = false,
  scriptUnsafeEval = "dev-only",
  workerBlob = false,
} = {}) {
  return async function headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const cspReportEndpoint = "/api/csp-report";

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
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Reporting-Endpoints",
        value: `csp="${cspReportEndpoint}"`,
      },
      {
        key: "Report-To",
        value: JSON.stringify({
          group: "csp-endpoint",
          max_age: 10886400,
          endpoints: [{ url: cspReportEndpoint }],
        }),
      },
      {
        key: "Content-Security-Policy",
        value: buildCsp({
          isDevelopment,
          imgBlob,
          scriptUnsafeEval,
          workerBlob,
          cspReportEndpoint,
        }),
      },
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
 * Builds the Content-Security-Policy header value.
 * @param {object} opts
 * @returns {string}
 */
function buildCsp({
  isDevelopment,
  imgBlob,
  scriptUnsafeEval,
  workerBlob,
  cspReportEndpoint,
}) {
  const useUnsafeEval =
    scriptUnsafeEval === "always" ||
    (scriptUnsafeEval === "dev-only" && isDevelopment);

  const directives = [
    "default-src 'self'",
    `script-src 'self'${useUnsafeEval ? " 'unsafe-eval'" : ""} 'unsafe-inline'${workerBlob ? " blob:" : ""} https://va.vercel-scripts.com`,
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
