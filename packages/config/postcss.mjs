/**
 * Shared PostCSS configuration for Tailwind CSS v4.
 * Zone apps re-export this file from `postcss.config.mjs`. The plugin is loaded from
 * `@helvety/dev-deps` so Vitest and local builds resolve it even when zone apps only
 * depend on `@helvety/ui` for production Turbopack paths (see `docs/vercel-monorepo-apps.md`).
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const devDepsRequire = createRequire(
  path.join(configDir, "../dev-deps/package.json")
);

const tailwindPostcss = devDepsRequire("@tailwindcss/postcss");

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [tailwindPostcss()],
};

export default config;
