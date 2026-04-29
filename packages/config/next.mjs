import path from "node:path";

import { createSecurityHeaders } from "./next-headers.mjs";

/**
 * Parse a CSV env var to origin list.
 *
 * @param {string | undefined} value
 * @returns {string[]}
 */
function parseOriginCsv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Build production-safe default server-action origins for Vercel deployments.
 * Falls back to explicit env config when provided.
 *
 * @returns {string[]}
 */
function getVercelDefaultAllowedOrigins() {
  const origins = new Set(["https://helvety.com"]);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`);
  }

  const branchUrl = process.env.VERCEL_BRANCH_URL?.trim();
  if (branchUrl) {
    origins.add(`https://${branchUrl}`);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    origins.add(`https://${productionUrl}`);
  }

  return Array.from(origins);
}

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
  const isVercelProductionBuild = process.env.VERCEL === "1";
  const explicitAllowedOrigins = parseOriginCsv(
    process.env.HELVETY_SERVER_ACTION_ALLOWED_ORIGINS
  );
  const allowedOrigins =
    explicitAllowedOrigins.length > 0
      ? explicitAllowedOrigins
      : isVercelProductionBuild
        ? getVercelDefaultAllowedOrigins()
        : [];

  if (isVercelProductionBuild && allowedOrigins.length === 0) {
    throw new Error(
      "Unable to resolve server-action allowed origins for this Vercel build."
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
