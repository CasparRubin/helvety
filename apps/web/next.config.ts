import { createHelvetyNextConfig } from "@helvety/config/next";
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

const nextConfig: NextConfig = createHelvetyNextConfig({
  appName: "web",
  optimizePackageImports: [
    "lucide-react",
    "radix-ui",
    "sonner",
    "framer-motion",
    "motion",
    "gsap",
    "@gsap/react",
    "three",
    "postprocessing",
  ],
  overrides: {
    // Multi-zone rewrites: proxy path-based URLs to each app's Vercel deployment.
    async rewrites() {
      const isDev = process.env.NODE_ENV === "development";
      const devUrl = (port: number) => `http://localhost:${port}`;

      /**
       * Resolves sub-app origin: localhost in dev; in production build, internal
       * Vercel URL from env when set. When unset outside Vercel (e.g. local
       * `ci:release` / `next build`), falls back to localhost so the gateway
       * config still loads; Vercel sets VERCEL=1 and must supply these vars.
       */
      function getAppUrl(envVar: string, devPort: number): string {
        if (isDev) {
          return devUrl(devPort);
        }

        const value = process.env[envVar];
        if (value) {
          const parsed = normalizeUrl(value, envVar);
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
        if (process.env.VERCEL === "1") {
          throw new Error(
            `${envVar} is required on Vercel in production. Set it to the deployment URL for this app.`
          );
        }
        return devUrl(devPort);
      }

      const authUrl = getAppUrl("AUTH_URL", DEV_PORTS.auth);
      const tasksUrl = getAppUrl("TASKS_URL", DEV_PORTS.tasks);
      const contactsUrl = getAppUrl("CONTACTS_URL", DEV_PORTS.contacts);
      const notesUrl = getAppUrl("NOTES_URL", DEV_PORTS.notes);
      const linksUrl = getAppUrl("LINKS_URL", DEV_PORTS.links);
      const storeUrl = getAppUrl("STORE_URL", DEV_PORTS.store);
      const pdfUrl = getAppUrl("PDF_URL", DEV_PORTS.pdf);
      const imageUpscalerUrl = getAppUrl(
        "IMAGE_UPSCALER_URL",
        DEV_PORTS.imageUpscaler
      );
      const analyticsScriptSource = "/:analyticsId([a-z0-9]+)/script.js";

      return {
        beforeFiles: [
          {
            // Vercel Analytics script path (e.g. /75d1cebe0bf9989d/script.js)
            // uses a root-relative URL, so route by referring app basePath.
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/auth(?:/.*)?$" },
            ],
            destination: `${authUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/tasks(?:/.*)?$" },
            ],
            destination: `${tasksUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/contacts(?:/.*)?$" },
            ],
            destination: `${contactsUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/notes(?:/.*)?$" },
            ],
            destination: `${notesUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/links(?:/.*)?$" },
            ],
            destination: `${linksUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              { type: "header", key: "referer", value: ".*/store(?:/.*)?$" },
            ],
            destination: `${storeUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [{ type: "header", key: "referer", value: ".*/pdf(?:/.*)?$" }],
            destination: `${pdfUrl}${analyticsScriptSource}`,
          },
          {
            source: analyticsScriptSource,
            has: [
              {
                type: "header",
                key: "referer",
                value: ".*/image-upscaler(?:/.*)?$",
              },
            ],
            destination: `${imageUpscalerUrl}${analyticsScriptSource}`,
          },
          {
            source: "/auth",
            destination: `${authUrl}/auth`,
          },
          {
            source: "/auth/:path*",
            destination: `${authUrl}/auth/:path*`,
          },
          {
            // Forward auth zone static assets (assetPrefix: /auth-static).
            source: "/auth-static/:path*",
            destination: `${authUrl}/auth-static/:path*`,
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
            source: "/links",
            destination: `${linksUrl}/links`,
          },
          {
            source: "/links/:path*",
            destination: `${linksUrl}/links/:path*`,
          },
          {
            source: "/links-static/:path*",
            destination: `${linksUrl}/links-static/:path*`,
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
          {
            source: "/image-upscaler",
            destination: `${imageUpscalerUrl}/image-upscaler`,
          },
          {
            source: "/image-upscaler/:path*",
            destination: `${imageUpscalerUrl}/image-upscaler/:path*`,
          },
        ],
      };
    },
  },
});

export default nextConfig;
