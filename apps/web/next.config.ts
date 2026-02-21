import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import { DEV_PORTS } from "@helvety/shared/config";
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

    /** Resolves the internal Vercel URL for a sub-app, falling back to localhost in dev. */
    function getAppUrl(envVar: string, devPort: number): string {
      const value = process.env[envVar];
      if (value) return value;
      if (isDev) return devUrl(devPort);
      throw new Error(
        `${envVar} is required in production. Set it to the Vercel deployment URL for this app.`
      );
    }

    const authUrl = getAppUrl("AUTH_URL", DEV_PORTS.auth);
    const tasksUrl = getAppUrl("TASKS_URL", DEV_PORTS.tasks);
    const contactsUrl = getAppUrl("CONTACTS_URL", DEV_PORTS.contacts);
    const storeUrl = getAppUrl("STORE_URL", DEV_PORTS.store);
    const pdfUrl = getAppUrl("PDF_URL", DEV_PORTS.pdf);

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
