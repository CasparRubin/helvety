import path from "path";

import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Next.js configuration for helvety-pdf (PDF tools)
 *
 * CSP Note: This app requires a RELAXED CSP for PDF.js functionality:
 * - 'unsafe-eval' is ALWAYS allowed (PDF.js uses eval for font parsing)
 * - 'blob:' in script-src for dynamic PDF content
 * - 'worker-src' for PDF.js web workers
 * - webpack canvas alias to prevent SSR errors
 * - turbopack root for proper module resolution
 */
const nextConfig: NextConfig = {
  // Enable compression
  compress: true,

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const cspReportEndpoint = "/api/csp-report";

    // Build headers array
    const headers = [
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
        // Note on 'unsafe-eval' and 'unsafe-inline':
        // - 'unsafe-eval': Required for PDF.js to parse and render PDF documents.
        //   PDF.js uses eval() for font parsing and some PDF operations.
        // - 'unsafe-inline': Required for Next.js styled-jsx and some React patterns.
        // These are necessary tradeoffs for functionality. XSS is mitigated through:
        // - Strict React JSX escaping (no dangerouslySetInnerHTML)
        // - Input validation on all user data
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.helvety.com https://*.supabase.co",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://va.vercel-scripts.com",
          "worker-src 'self' blob:",
          "frame-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "script-src-attr 'none'",
          `report-uri ${cspReportEndpoint}`,
          "report-to csp-endpoint",
          ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
        ].join("; "),
      },
    ];

    // Production-only security headers
    if (!isDevelopment) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      headers.push({
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      });
      headers.push({
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
        headers,
      },
    ];
  },

  // Webpack config (used during `next build` which still uses webpack).
  // Disables the canvas module to prevent SSR errors with PDF.js.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },

  // Turbopack config (used during `next dev` in Next.js 16).
  // Sets root for proper module resolution.
  turbopack: {
    root: path.resolve("."),
  },

  // Optimize tree-shaking for barrel-export packages
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui", "sonner"],
  },
};

export default withBundleAnalyzer(nextConfig);
