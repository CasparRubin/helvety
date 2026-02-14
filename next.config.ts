import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Next.js configuration for helvety-auth (authentication service)
 *
 * CSP Note: CSP is now applied per-request via proxy.ts with a unique nonce.
 * This replaces 'unsafe-inline' in script-src, providing strong XSS protection.
 * See proxy.ts for the CSP configuration.
 */
const nextConfig: NextConfig = {
  // Enable compression
  compress: true,

  // Security headers (CSP is set in proxy.ts with per-request nonce)
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Build headers array (CSP omitted — handled by proxy.ts with nonce)
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

  // Optimize tree-shaking for barrel-export packages
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "@simplewebauthn/browser",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
