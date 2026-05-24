/**
 * PostCSS / Tailwind build expectations for Helvety zone apps.
 * Used by check-consistency-guardrails.mjs and Vitest (postcss-app-consistency.test.ts).
 */
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

/** Exact postcss.config.mjs content for every Next.js zone app. */
export const CANONICAL_POSTCSS_CONFIG =
  'export { default } from "@helvety/config/postcss";\n';

/** Pinned production Tailwind toolchain on @helvety/ui (versions canonical in dev-deps). */
export const UI_TAILWIND_BUILD_DEPENDENCIES = {
  tailwindcss: "^4.3.0",
  "@tailwindcss/postcss": "^4.3.0",
};

/**
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export async function validatePostcssZoneApps(rootDir) {
  const errors = [];
  const appsDir = resolve(rootDir, "apps");
  const entries = await readdir(appsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const appName = entry.name;
    const postcssPath = resolve(appsDir, appName, "postcss.config.mjs");
    try {
      await access(postcssPath);
    } catch {
      continue;
    }

    const postcssContent = await readFile(postcssPath, "utf8");
    if (postcssContent !== CANONICAL_POSTCSS_CONFIG) {
      errors.push(
        `apps/${appName}/postcss.config.mjs must re-export @helvety/config/postcss only.`
      );
    }

    const packageJson = JSON.parse(
      await readFile(resolve(appsDir, appName, "package.json"), "utf8")
    );
    if (packageJson.dependencies?.["@helvety/ui"] !== "workspace:*") {
      errors.push(
        `apps/${appName}/package.json must depend on @helvety/ui (production) so @tailwindcss/postcss resolves on Vercel.`
      );
    }
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} uiManifest parsed packages/ui/package.json
 * @returns {string[]}
 */
export function validateUiTailwindBuildDependencies(uiManifest) {
  const errors = [];
  const dependencies = uiManifest.dependencies ?? {};

  for (const [dependencyName, expectedVersion] of Object.entries(
    UI_TAILWIND_BUILD_DEPENDENCIES
  )) {
    const actualVersion = dependencies[dependencyName];
    if (!actualVersion) {
      errors.push(
        `packages/ui/package.json: missing production ${dependencyName} (required for Vercel PostCSS resolution; expected ${expectedVersion})`
      );
      continue;
    }
    if (actualVersion !== expectedVersion) {
      errors.push(
        `packages/ui/package.json: ${dependencyName} is ${actualVersion} (expected ${expectedVersion})`
      );
    }
  }

  return errors;
}
