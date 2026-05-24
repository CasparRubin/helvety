/**
 * Shared PostCSS configuration for Tailwind CSS v4.
 * Zone apps re-export this file from `postcss.config.mjs`. The `@tailwindcss/postcss`
 * plugin is resolved from each app directory at build time; install it on the production
 * dependency path via `@helvety/ui` (see `docs/vercel-monorepo-apps.md`).
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
