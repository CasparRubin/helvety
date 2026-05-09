/**
 * Verifies each app's `public/manifest.json` `description` matches the primary
 * SEO blurb exported from `app/layout.tsx` (or `lib/product-copy` PWA fields for PDF / image-upscaler).
 *
 * Run: `bun run consistency:install-manifest-metadata`
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PDF_PWA_MANIFEST_DESCRIPTION } from "../apps/pdf/lib/product-copy.ts";
import { IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION } from "../apps/image-upscaler/lib/product-copy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function manifestDescription(app) {
  const filePath = path.join(root, "apps", app, "public", "manifest.json");
  return JSON.parse(readFileSync(filePath, "utf8")).description;
}

function parseQuotedStringExport(layoutRelative, constName) {
  const fp = path.join(root, layoutRelative);
  const raw = readFileSync(fp, "utf8");
  const escapedName = constName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `export const ${escapedName} =\\s*(?:\\r?\\n\\s*)?"([^"]*)";`
  );
  const m = raw.match(re);
  if (!m) {
    throw new Error(
      `Could not parse export const ${constName} in ${layoutRelative}`
    );
  }
  return m[1];
}

const manifestChecks = [
  {
    app: "web",
    expected: () =>
      parseQuotedStringExport(
        "apps/web/app/layout.tsx",
        "WEB_SITE_DESCRIPTION"
      ),
  },
  {
    app: "auth",
    expected: () =>
      parseQuotedStringExport(
        "apps/auth/app/layout.tsx",
        "AUTH_PWA_MANIFEST_DESCRIPTION"
      ),
  },
  {
    app: "store",
    expected: () =>
      parseQuotedStringExport("apps/store/app/layout.tsx", "STORE_DESCRIPTION"),
  },
  {
    app: "contacts",
    expected: () =>
      parseQuotedStringExport(
        "apps/contacts/app/layout.tsx",
        "CONTACTS_APP_DESCRIPTION"
      ),
  },
  {
    app: "notes",
    expected: () =>
      parseQuotedStringExport(
        "apps/notes/app/layout.tsx",
        "NOTES_APP_DESCRIPTION"
      ),
  },
  {
    app: "tasks",
    expected: () =>
      parseQuotedStringExport(
        "apps/tasks/app/layout.tsx",
        "TASKS_APP_DESCRIPTION"
      ),
  },
  {
    app: "pdf",
    expected: () => PDF_PWA_MANIFEST_DESCRIPTION,
  },
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
