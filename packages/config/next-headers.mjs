/**
 * Shared security headers factory for all Helvety Next.js apps.
 *
 * Generates consistent HSTS, COOP, and other security headers.
 * CSP is generated per-request in proxy.ts with a cryptographic nonce.
 *
 * @param {object} options
 * @param {string} options.appName - App identifier used in X-Helvety-App header for debugging and CSP report correlation
 * @returns {import("next").NextConfig["headers"]} Next.js headers function
 */
export function createSecurityHeaders({ appName } = {}) {
  return async function headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    const headersList = [
      ...(appName ? [{ key: "X-Helvety-App", value: appName }] : []),
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
        // Disabled: X-XSS-Protection is deprecated.
        // Modern browsers rely on CSP; setting "0" disables the legacy filter.
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
      // Intentionally omit COEP across all apps.
      //
      // Helvety uses multi-zone rewrites for app routing, and strict COEP can
      // cause browser access-control failures on internal Next.js RSC fetches
      // (`?_rsc=...`) when responses cross zone boundaries.
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
 * Uses nonce + strict-dynamic and intentionally avoids legacy inline-script
 * fallback to keep a fail-closed policy in modern browsers.
 *
 * @param {object} opts
 * @param {string} opts.nonce - Cryptographic nonce for this request
 * @param {boolean} [opts.imgBlob=false] - Allow blob: in img-src
 * @param {"always" | "dev-only"} [opts.scriptUnsafeEval="dev-only"] - When to allow 'unsafe-eval'
 * @param {boolean} [opts.workerBlob=false] - Add worker-src 'self' blob:
 * @param {boolean} [opts.wasmUnsafeEval=false] - Add 'wasm-unsafe-eval' to script-src (required for WebAssembly compilation, e.g. onnxruntime-web)
 * @returns {string}
 */
export function buildCsp({
  nonce,
  imgBlob = false,
  scriptUnsafeEval = "dev-only",
  workerBlob = false,
  wasmUnsafeEval = false,
} = {}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const cspReportEndpoint = "/api/csp-report";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const useUnsafeEval =
    scriptUnsafeEval === "always" ||
    (scriptUnsafeEval === "dev-only" && isDevelopment);
  // 'wasm-unsafe-eval' is implied when 'unsafe-eval' is present, so only emit it
  // explicitly when 'unsafe-eval' is not.
  const useWasmUnsafeEval = wasmUnsafeEval && !useUnsafeEval;

  const nonceDirective = nonce ? ` 'nonce-${nonce}'` : "";
  const connectSources = new Set(["'self'", "https://va.vercel-scripts.com"]);
  const imageSources = new Set(["'self'", "data:", "https://helvety.com"]);

  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.protocol === "https:") {
        connectSources.add(parsed.origin);
        connectSources.add(`wss://${parsed.host}`);
        imageSources.add(parsed.origin);
      }
    } catch {
      // Ignore malformed env values; runtime env validation handles this.
    }
  }

  const directives = [
    "default-src 'self'",
    `script-src 'self'${useUnsafeEval ? " 'unsafe-eval'" : ""}${useWasmUnsafeEval ? " 'wasm-unsafe-eval'" : ""}${nonceDirective} 'strict-dynamic'${workerBlob ? " blob:" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${Array.from(imageSources).join(" ")}${imgBlob ? " blob:" : ""}`,
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSources).join(" ")}`,
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
