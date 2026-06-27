/**
 * Shared rules for customer-facing product copy (Store catalog, llms.txt, legal
 * product bullets, SEO metadata constants). Em-dash (U+2014) is enforced via
 * `consistency:customer-copy` and Vitest. SEO/PWA summaries must stay license-free
 * (AGPL only in legal pages, Store product About, and llms.txt `## Licensing`).
 * Keep paths here in sync with `scripts/check-customer-copy-style.mjs`.
 */

/** U+2014 em-dash; must not appear in user-facing copy. */
export const CUSTOMER_COPY_EM_DASH = "\u2014";

/** Repo-relative app and root README intros. */
export const CUSTOMER_COPY_README_RELATIVE_PATHS = [
  "README.md",
  "apps/pdf/README.md",
  "apps/tasks/README.md",
  "apps/contacts/README.md",
  "apps/links/README.md",
  "apps/notes/README.md",
  "apps/auth/README.md",
  "apps/store/README.md",
  "apps/web/README.md",
  "apps/image-upscaler/README.md",
] as const;

/** Repo-relative paths to hand-maintained `public/llms.txt` summaries. */
export const CUSTOMER_COPY_LLMS_RELATIVE_PATHS = [
  "apps/web/public/llms.txt",
  "apps/store/public/llms.txt",
  "apps/pdf/public/llms.txt",
  "apps/tasks/public/llms.txt",
  "apps/contacts/public/llms.txt",
  "apps/links/public/llms.txt",
  "apps/notes/public/llms.txt",
  "apps/auth/public/llms.txt",
  "apps/image-upscaler/public/llms.txt",
] as const;

/** PWA install prompts and similar public JSON copy. */
export const CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS = [
  "apps/web/public/manifest.json",
  "apps/store/public/manifest.json",
  "apps/pdf/public/manifest.json",
  "apps/tasks/public/manifest.json",
  "apps/contacts/public/manifest.json",
  "apps/links/public/manifest.json",
  "apps/notes/public/manifest.json",
  "apps/auth/public/manifest.json",
  "apps/image-upscaler/public/manifest.json",
] as const;

/**
 * Repo-relative files with fixed marketing/legal/SEO strings.
 * App `.tsx` UI is scanned separately (see `CUSTOMER_COPY_USER_FACING_APP_GLOBS`).
 */
export const CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS = [
  ...CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
  ...CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS,
  "packages/shared/src/store-catalog.ts",
  "packages/shared/src/app-product-descriptions.ts",
  "packages/shared/src/app-navbar-about.ts",
  "packages/shared/src/licensing.ts",
  "packages/shared/src/user-facing-errors.ts",
  "packages/shared/src/power-platform-configurator-copy.ts",
  "apps/store/lib/data/products.ts",
  "apps/pdf/lib/product-copy.ts",
  "apps/image-upscaler/lib/product-copy.ts",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/impressum/page.tsx",
] as const;

/**
 * Under each app folder, walk `app/**` and `components/**` for `.tsx` (not tests).
 * Used by `scripts/check-customer-copy-style.mjs`.
 */
export const CUSTOMER_COPY_USER_FACING_APP_IDS = [
  "auth",
  "contacts",
  "image-upscaler",
  "links",
  "notes",
  "pdf",
  "store",
  "tasks",
  "web",
] as const;

/** Minimum chars shared between catalog card blurb and Store About intro (see store products.test). */
export const CUSTOMER_COPY_CARD_ABOUT_PREFIX_OVERLAP_MAX = 60;
