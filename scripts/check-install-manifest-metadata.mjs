/**
 * Verifies each app's `public/manifest.json` `description` matches the primary
 * SEO blurb exported from shared product copy (or `lib/product-copy` for PDF / image-upscaler).
 *
 * Run: `bun run consistency:install-manifest-metadata`
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTH_PWA_MANIFEST_DESCRIPTION,
  CONTACTS_APP_DESCRIPTION,
  LINKS_APP_DESCRIPTION,
  NOTES_APP_DESCRIPTION,
  STORE_DESCRIPTION,
  TASKS_APP_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "../packages/shared/src/app-product-descriptions.ts";
import { IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION } from "../apps/image-upscaler/lib/product-copy.ts";
import { PDF_PWA_MANIFEST_DESCRIPTION } from "../apps/pdf/lib/product-copy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function manifestDescription(app) {
  const filePath = path.join(root, "apps", app, "public", "manifest.json");
  return JSON.parse(readFileSync(filePath, "utf8")).description;
}

const manifestChecks = [
  { app: "web", expected: () => WEB_SITE_DESCRIPTION },
  { app: "auth", expected: () => AUTH_PWA_MANIFEST_DESCRIPTION },
  { app: "store", expected: () => STORE_DESCRIPTION },
  { app: "contacts", expected: () => CONTACTS_APP_DESCRIPTION },
  { app: "notes", expected: () => NOTES_APP_DESCRIPTION },
  { app: "tasks", expected: () => TASKS_APP_DESCRIPTION },
  { app: "links", expected: () => LINKS_APP_DESCRIPTION },
  { app: "pdf", expected: () => PDF_PWA_MANIFEST_DESCRIPTION },
  {
    app: "image-upscaler",
    expected: () => IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION,
  },
];

function main() {
  for (const { app, expected } of manifestChecks) {
    const want = expected();
    const got = manifestDescription(app);
    if (got !== want) {
      console.error(
        `manifest description mismatch for apps/${app}:\n  manifest: ${JSON.stringify(got)}\n  expected: ${JSON.stringify(want)}`
      );
      process.exit(1);
    }
  }
  console.log(
    "install manifest metadata OK (descriptions match layout / product-copy PWA constants)"
  );
}

main();
