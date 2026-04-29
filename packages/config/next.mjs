import path from "node:path";

import { createSecurityHeaders } from "./next-headers.mjs";

/**
 * Shared Next.js config defaults for Helvety apps.
 *
 * @param {object} options
 * @param {string} options.appName
 * @param {string} [options.basePath]
 * @param {string} [options.assetPrefix]
 * @param {string[]} [options.optimizePackageImports]
 * @param {import("next").NextConfig} [options.overrides]
 * @returns {import("next").NextConfig}
 */
export function createHelvetyNextConfig({
  appName,
  basePath,
  assetPrefix,
  optimizePackageImports = ["lucide-react", "radix-ui", "sonner"],
  overrides = {},
}) {
  const rawAllowedOrigins = process.env.HELVETY_SERVER_ACTION_ALLOWED_ORIGINS;
  const allowedOrigins = rawAllowedOrigins
    ? rawAllowedOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
  const isVercelProductionBuild = process.env.VERCEL === "1";

  if (isVercelProductionBuild && allowedOrigins.length === 0) {
    throw new Error(
      "HELVETY_SERVER_ACTION_ALLOWED_ORIGINS must be set for production builds."
    );
  }

  return {
    poweredByHeader: false,
    compress: true,
    ...(basePath ? { basePath } : {}),
    ...(assetPrefix ? { assetPrefix } : {}),
    headers: createSecurityHeaders({ appName }),
    turbopack: {
      root: path.resolve("../.."),
    },
    reactCompiler: true,
    // Upgrade guardrail: on every Next major/minor bump, re-check release notes for
    // `experimental.optimizePackageImports` and
    // `experimental.serverActions.allowedOrigins`; migrate to stable config keys
    // when equivalent options become available.
    experimental: {
      optimizePackageImports,
      ...(allowedOrigins.length > 0
        ? {
            serverActions: {
              allowedOrigins,
            },
          }
        : {}),
      ...(overrides.experimental ?? {}),
    },
    ...overrides,
  };
}
