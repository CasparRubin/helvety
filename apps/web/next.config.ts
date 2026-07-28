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
    "@base-ui/react",
    "sonner",
    "framer-motion",
    "gsap",
    "@gsap/react",
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

      const storeUrl = getAppUrl("STORE_URL", DEV_PORTS.store);
      const pdfUrl = getAppUrl("PDF_URL", DEV_PORTS.pdf);
      const imageEditorUrl = getAppUrl(
        "IMAGE_EDITOR_URL",
        DEV_PORTS.imageEditor
      );
      const ocrUrl = getAppUrl("OCR_URL", DEV_PORTS.ocr);

      return {
        beforeFiles: [
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
            source: "/image-editor",
            destination: `${imageEditorUrl}/image-editor`,
          },
          {
            source: "/image-editor/:path*",
            destination: `${imageEditorUrl}/image-editor/:path*`,
          },
          {
            source: "/ocr",
            destination: `${ocrUrl}/ocr`,
          },
          {
            source: "/ocr/:path*",
            destination: `${ocrUrl}/ocr/:path*`,
          },
        ],
      };
    },
  },
});

export default nextConfig;
