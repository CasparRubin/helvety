#!/usr/bin/env node
/**
 * Ensures E2EE display catalogs and URL normalization live in @helvety/shared
 * and zone apps do not re-declare catalog array literals.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const CATALOG_CANONICAL = join(
  repoRoot,
  "packages/shared/src/e2ee-entity-catalogs.ts"
);

const ZONE_CATALOG_FILES = [
  "apps/tasks/lib/config/default-stages.ts",
  "apps/tasks/lib/config/default-labels.ts",
  "apps/contacts/lib/config/default-categories.ts",
  "apps/notes/lib/config/default-note-categories.ts",
  "apps/links/lib/url-normalize.ts",
];

for (const relativePath of ZONE_CATALOG_FILES) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing ${relativePath}`);
    continue;
  }
  const src = readFileSync(fullPath, "utf8");
  if (!src.includes("@helvety/shared/e2ee-")) {
    failures.push(
      `${relativePath}: must import from @helvety/shared/e2ee-entity-catalogs or e2ee-url-normalize`
    );
  }
  if (/export const \w+ = \[\s*\{[\s\S]*?id:/.test(src)) {
    failures.push(
      `${relativePath}: must not export inline catalog array literals`
    );
  }
}

const tasksPriorities = join(repoRoot, "apps/tasks/lib/priorities.ts");
if (existsSync(tasksPriorities)) {
  const src = readFileSync(tasksPriorities, "utf8");
  if (!src.includes("TASK_PRIORITY_METADATA")) {
    failures.push(
      "apps/tasks/lib/priorities.ts: must use TASK_PRIORITY_METADATA from @helvety/shared/e2ee-entity-catalogs"
    );
  }
}

const extensionRoot = join(repoRoot, "../helvety-browser-extension-chromium");
if (existsSync(join(extensionRoot, "src/lib/entity-repository.ts"))) {
  if (existsSync(join(extensionRoot, "src/lib/entity-catalogs.ts"))) {
    failures.push(
      "extension: remove src/lib/entity-catalogs.ts; use @helvety/shared/e2ee-entity-catalogs"
    );
  }
  if (existsSync(join(extensionRoot, "src/lib/link-url-normalize.ts"))) {
    const src = readFileSync(
      join(extensionRoot, "src/lib/link-url-normalize.ts"),
      "utf8"
    );
    if (!src.includes("@helvety/shared/e2ee-url-normalize")) {
      failures.push(
        "extension src/lib/link-url-normalize.ts: must re-export @helvety/shared/e2ee-url-normalize"
      );
    }
  }
}

if (!existsSync(CATALOG_CANONICAL)) {
  failures.push("Missing packages/shared/src/e2ee-entity-catalogs.ts");
}

if (failures.length > 0) {
  console.error("consistency:e2ee-catalogs failed:\n");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("consistency:e2ee-catalogs OK");
