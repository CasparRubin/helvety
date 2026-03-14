import path from "path";

import { createSecurityHeaders } from "@helvety/config/next-headers";
import { DEV_PORTS } from "@helvety/shared/config";

import type { NextConfig } from "next";

const DEFAULT_ALLOWED_PRODUCTION_HOST_SUFFIXES = [
  ".vercel.app",
  ".helvety.com",
];

/** Parse and validate an absolute URL from environment config. */
function normalizeUrl(rawUrl: string, envVar: string): URL {
  try {
    return new URL(rawUrl);
  } catch {
    throw new Error(
      `${envVar} must be a valid absolute URL (e.g. https://your-app.vercel.app).`
    );
  }
}

/** Restrict production rewrites to trusted internal hosts. */
function isAllowedProductionHost(hostname: string): boolean {
  if (hostname === "helvety.com") {
    return true;
  }
  if (
    DEFAULT_ALLOWED_PRODUCTION_HOST_SUFFIXES.some((suffix) =>
      hostname.endsWith(suffix)
    )
  ) {
    return true;
  }
  return false;
}

const nextConfig: NextConfig = {
  compress: true,

  // Multi-zone rewrites: proxy path-based URLs to each app's Vercel deployment.
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const devUrl = (port: number) => `http://localhost:${port}`;

    /** Resolves the internal Vercel URL for a sub-app, falling back to localhost in dev. */
    function getAppUrl(envVar: string, devPort: number): string {
      const value = process.env[envVar];
      if (value) {
        const parsed = normalizeUrl(value, envVar);
        if (isDev) {
          if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error(
              `${envVar} must use http:// or https:// in development.`
            );
          }
          return parsed.origin;
        }
        if (parsed.protocol !== "https:") {
          throw new Error(`${envVar} must use https:// in production.`);
        }
        if (!isAllowedProductionHost(parsed.hostname)) {
          throw new Error(
            `${envVar} host "${parsed.hostname}" is not allowed. Use a *.vercel.app or *.helvety.com host.`
          );
        }
        return parsed.origin;
      }
      if (isDev) return devUrl(devPort);
      throw new Error(
        `${envVar} is required in production. Set it to the Vercel deployment URL for this app.`
      );
    }

    const authUrl = getAppUrl("AUTH_URL", DEV_PORTS.auth);
    const tasksUrl = getAppUrl("TASKS_URL", DEV_PORTS.tasks);
    const contactsUrl = getAppUrl("CONTACTS_URL", DEV_PORTS.contacts);
    const notesUrl = getAppUrl("NOTES_URL", DEV_PORTS.notes);
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
          // Use :path* so trailing-slash and empty-subpath variants
          // (including some App Router RSC prefetch forms) are forwarded too.
          source: "/tasks/:path*",
          destination: `${tasksUrl}/tasks/:path*`,
        },
        {
          source: "/tasks-static/:path*",
          destination: `${tasksUrl}/tasks-static/:path*`,
        },
        {
          source: "/contacts",
          destination: `${contactsUrl}/contacts`,
        },
        {
          // Use :path* so trailing-slash and empty-subpath variants
          // (including some App Router RSC prefetch forms) are forwarded too.
          source: "/contacts/:path*",
          destination: `${contactsUrl}/contacts/:path*`,
        },
        {
          source: "/contacts-static/:path*",
          destination: `${contactsUrl}/contacts-static/:path*`,
        },
        {
          source: "/notes",
          destination: `${notesUrl}/notes`,
        },
        {
          source: "/notes/:path*",
          destination: `${notesUrl}/notes/:path*`,
        },
        {
          source: "/notes-static/:path*",
          destination: `${notesUrl}/notes-static/:path*`,
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

  reactCompiler: true,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "framer-motion",
    ],
  },
};

export default nextConfig;
