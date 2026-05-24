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
 * Build default server-action allowed origins for Vercel builds (preview + production).
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

  const {
    experimental: experimentalOverrides = {},
    serverActions: explicitServerActionsOverrides = {},
    optimizePackageImports: explicitOptimizePackageImports,
    turbopack: turbopackOverrides = {},
    ...restOverrides
  } = overrides;

  const {
    optimizePackageImports: experimentalOptimizePackageImports,
    serverActions: experimentalServerActions = {},
    ...restExperimentalOverrides
  } = experimentalOverrides;

  const mergedOptimizePackageImports =
    explicitOptimizePackageImports ??
    experimentalOptimizePackageImports ??
    optimizePackageImports;

  const mergedAllowedOrigins =
    explicitServerActionsOverrides.allowedOrigins ??
    experimentalServerActions.allowedOrigins ??
    (allowedOrigins.length > 0 ? allowedOrigins : undefined);

  return {
    poweredByHeader: false,
    compress: true,
    ...(basePath ? { basePath } : {}),
    ...(assetPrefix ? { assetPrefix } : {}),
    headers: createSecurityHeaders({ appName }),
    turbopack: {
      root: path.resolve("../.."),
      ...turbopackOverrides,
    },
    reactCompiler: true,
    // Next.js currently documents both options under experimental config.
    experimental: {
      ...restExperimentalOverrides,
      // May reduce unused CSS preload warnings while loading shells or encryption gates are active.
      cssChunking: "strict",
      optimizePackageImports: mergedOptimizePackageImports,
      ...(mergedAllowedOrigins
        ? {
            serverActions: {
              ...experimentalServerActions,
              ...explicitServerActionsOverrides,
              allowedOrigins: mergedAllowedOrigins,
            },
          }
        : {}),
    },
    ...restOverrides,
  };
}

const DEFAULT_OPTIMIZE_IMPORTS = ["lucide-react", "radix-ui", "sonner"];

const E2EE_DND_OPTIMIZE_IMPORTS = [
  ...DEFAULT_OPTIMIZE_IMPORTS,
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
];

/**
 * Next config for E2EE list zones (tasks, contacts, notes, links).
 *
 * @param {object} options
 * @param {string} options.appName
 * @param {string[]} [options.extraOptimize]
 * @param {import("next").NextConfig} [options.overrides]
 * @returns {import("next").NextConfig}
 */
export function createE2eeZoneNextConfig({
  appName,
  extraOptimize = [],
  overrides = {},
}) {
  return createHelvetyNextConfig({
    appName,
    basePath: `/${appName}`,
    assetPrefix: `/${appName}-static`,
    optimizePackageImports: [...E2EE_DND_OPTIMIZE_IMPORTS, ...extraOptimize],
    overrides,
  });
}

/**
 * Next config for public tool zones (pdf, docs, image-upscaler) without assetPrefix.
 *
 * @param {object} options
 * @param {string} options.appName
 * @param {string[]} [options.optimizePackageImports]
 * @param {import("next").NextConfig} [options.overrides]
 * @returns {import("next").NextConfig}
 */
export function createPublicToolNextConfig({
  appName,
  optimizePackageImports,
  overrides = {},
}) {
  return createHelvetyNextConfig({
    appName,
    basePath: `/${appName}`,
    ...(optimizePackageImports ? { optimizePackageImports } : {}),
    overrides,
  });
}

/**
 * Next config for the auth gateway zone.
 *
 * @param {import("next").NextConfig} [overrides]
 * @returns {import("next").NextConfig}
 */
export function createAuthGatewayNextConfig(overrides = {}) {
  return createHelvetyNextConfig({
    appName: "auth",
    basePath: "/auth",
    assetPrefix: "/auth-static",
    optimizePackageImports: [
      ...DEFAULT_OPTIMIZE_IMPORTS,
      "@simplewebauthn/browser",
    ],
    overrides,
  });
}
