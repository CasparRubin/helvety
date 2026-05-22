/**
 * Fails when user-facing copy contains U+2014 em-dashes.
 *
 * Run: `bun run consistency:customer-copy`
 *
 * Paths mirror `packages/shared/src/customer-copy-guardrails.ts`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EM_DASH = "\u2014";

/** Keep in sync with `customer-copy-guardrails.ts`. */
const EXPLICIT_RELATIVE_PATHS = [
  "apps/web/public/llms.txt",
  "apps/store/public/llms.txt",
  "apps/pdf/public/llms.txt",
  "apps/tasks/public/llms.txt",
  "apps/contacts/public/llms.txt",
  "apps/notes/public/llms.txt",
  "apps/links/public/llms.txt",
  "apps/auth/public/llms.txt",
  "apps/image-upscaler/public/llms.txt",
  "apps/web/public/manifest.json",
  "apps/store/public/manifest.json",
  "apps/pdf/public/manifest.json",
  "apps/tasks/public/manifest.json",
  "apps/contacts/public/manifest.json",
  "apps/notes/public/manifest.json",
  "apps/links/public/manifest.json",
  "apps/auth/public/manifest.json",
  "apps/image-upscaler/public/manifest.json",
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
];

const USER_FACING_APP_IDS = [
  "auth",
  "contacts",
  "image-upscaler",
  "links",
  "notes",
  "pdf",
  "store",
  "tasks",
  "web",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "ort",
]);

function collectTsxUnder(dir) {
  const files = [];
  const stat = statSync(dir);
  if (!stat.isDirectory()) {
    return files;
  }
  if (SKIP_DIRS.has(path.basename(dir))) {
    return files;
  }
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (name.endsWith(".test.tsx") || name.endsWith(".test.ts")) {
      continue;
    }
    const childStat = statSync(abs);
    if (childStat.isDirectory()) {
      files.push(...collectTsxUnder(abs));
      continue;
    }
    if (name.endsWith(".tsx")) {
      files.push(abs);
    }
  }
  return files;
}

function collectUserFacingAppTsx() {
  const files = [];
  for (const appId of USER_FACING_APP_IDS) {
    const base = path.join(root, "apps", appId);
    for (const segment of ["app", "components"]) {
      const dir = path.join(base, segment);
      try {
        files.push(...collectTsxUnder(dir));
      } catch {
        // app has no components/ or app/ segment
      }
    }
  }
  return files;
}

function scanFiles() {
  const explicit = EXPLICIT_RELATIVE_PATHS.map((rel) => path.join(root, rel));
  return [...new Set([...explicit, ...collectUserFacingAppTsx()])];
}

function main() {
  const violations = [];
  for (const filePath of scanFiles()) {
    const content = readFileSync(filePath, "utf8");
    if (content.includes(EM_DASH)) {
      violations.push(path.relative(root, filePath));
    }
  }
  if (violations.length > 0) {
    console.error(
      "Em-dash (U+2014) in user-facing copy; use commas, periods, or parentheses:"
    );
    for (const rel of violations.sort()) {
      console.error(`  ${rel}`);
    }
    process.exit(1);
  }
  console.log("customer copy style OK (no em-dashes in user-facing copy)");
}

main();
