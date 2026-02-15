import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import { DEV_PORTS, DOMAIN } from "@helvety/shared/config";
import bundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  compress: true,

  // Multi-zone rewrites: proxy path-based URLs to each app's Vercel deployment.
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const devUrl = (port: number) => `http://localhost:${port}`;
    const prodFallback = `https://${DOMAIN}`;

    const authUrl =
      process.env.AUTH_URL ?? (isDev ? devUrl(DEV_PORTS.auth) : prodFallback);
    const tasksUrl =
      process.env.TASKS_URL ?? (isDev ? devUrl(DEV_PORTS.tasks) : prodFallback);
    const contactsUrl =
      process.env.CONTACTS_URL ??
      (isDev ? devUrl(DEV_PORTS.contacts) : prodFallback);
    const storeUrl =
      process.env.STORE_URL ?? (isDev ? devUrl(DEV_PORTS.store) : prodFallback);
    const pdfUrl =
      process.env.PDF_URL ?? (isDev ? devUrl(DEV_PORTS.pdf) : prodFallback);

    return {
      beforeFiles: [
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
      ],
    };
  },

  headers: createSecurityHeaders({ appName: "web" }),

  turbopack: {
    root: path.resolve("../.."),
  },

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
