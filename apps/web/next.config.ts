import path from "path";

import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Next.js configuration for the Web app (main site)
 *
 * CSP Note: This app uses the baseline secure CSP configuration.
 * - 'unsafe-eval' is only allowed in development (for Fast Refresh)
 * - No blob: or worker-src needed (no web workers or PDF rendering)
 */
const nextConfig: NextConfig = {
  // Enable compression
  compress: true,

  // Multi-zone rewrites: proxy path-based URLs to each app's Vercel deployment.
  // In production, AUTH_URL/TASKS_URL/etc. are the internal Vercel deployment URLs.
  // In development, they point to the local dev server ports.
  async rewrites() {
    const authUrl =
      process.env.AUTH_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3002"
        : "https://helvety.com");
    const tasksUrl =
      process.env.TASKS_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3005"
        : "https://helvety.com");
    const contactsUrl =
      process.env.CONTACTS_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3006"
        : "https://helvety.com");
    const storeUrl =
      process.env.STORE_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3003"
        : "https://helvety.com");
    const pdfUrl =
      process.env.PDF_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3004"
        : "https://helvety.com");

    return [
      {
        source: "/auth",
        destination: `${authUrl}/auth`,
      },
      {
        source: "/auth/:path*",
        destination: `${authUrl}/auth/:path*`,
      },
      {
        source: "/tasks",
        destination: `${tasksUrl}/tasks`,
      },
      {
        source: "/tasks/:path*",
        destination: `${tasksUrl}/tasks/:path*`,
      },
      {
        source: "/contacts",
        destination: `${contactsUrl}/contacts`,
      },
      {
        source: "/contacts/:path*",
        destination: `${contactsUrl}/contacts/:path*`,
      },
      {
        source: "/store",
        destination: `${storeUrl}/store`,
      },
      {
        source: "/store/:path*",
        destination: `${storeUrl}/store/:path*`,
      },
      {
        source: "/pdf",
        destination: `${pdfUrl}/pdf`,
      },
      {
        source: "/pdf/:path*",
        destination: `${pdfUrl}/pdf/:path*`,
      },
    ];
  },

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
        // - 'unsafe-eval': Only included in development for Next.js Fast Refresh.
        //   Removed in production to prevent eval-based XSS attacks.
        // - 'unsafe-inline': Required for Next.js styled-jsx and some React patterns.
        // XSS is mitigated through:
        // - Strict React JSX escaping (no dangerouslySetInnerHTML)
        // - Input validation on all user data
        // - HTTPOnly cookies for authentication
        value: [
          "default-src 'self'",
          `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ""} 'unsafe-inline' https://va.vercel-scripts.com`,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https://*.helvety.com https://*.supabase.co",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://va.vercel-scripts.com",
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

  // Set turbopack root to monorepo root so hoisted dependencies (node_modules) are resolvable
  turbopack: {
    root: path.resolve("../.."),
  },

  // Optimize tree-shaking for barrel-export packages
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "framer-motion",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
