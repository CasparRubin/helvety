/**
 * Enforces kebab-case source filenames under app and package src trees.
 * See docs/naming-conventions.md and docs/app-consistency-checklist.md.
 */
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

/** Next.js App Router reserved file stems (exact match on primary segment). */
const NEXT_RESERVED_STEMS = new Set([
  "page",
  "layout",
  "route",
  "template",
  "default",
  "loading",
  "error",
  "global-error",
  "not-found",
  "forbidden",
  "unauthorized",
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
  "favicon",
  "sitemap",
  "robots",
  "manifest",
]);

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SCAN_ROOTS = [
  {
    label: "apps",
    dir: resolve(rootDir, "apps"),
    subdirs: ["app", "lib", "components", "hooks"],
  },
  {
    label: "packages",
    dir: resolve(rootDir, "packages"),
    subdirs: ["src"],
  },
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "vendor",
]);

/**
 * Paths allowed to violate kebab-case until migrated (ratchet toward empty).
 * Generated or legacy dotted/colocated test names.
 */
const ALLOWLIST = new Set([
  "apps/auth/components/encryption-setup.copy.test.ts",
  "apps/store/app/products/[slug]/page.seo.test.tsx",
  "packages/shared/src/types/database.types.ts",
  "packages/ui/src/helvety-theme-init-script.test-helpers.ts",
]);

function toRelative(filePath) {
  return filePath.replace(`${rootDir}/`, "");
}

function fileStem(fileName) {
  const withoutExt = fileName.replace(/\.(tsx?|mts?|mjs)$/, "");
  if (withoutExt.endsWith(".test") || withoutExt.endsWith(".spec")) {
    return withoutExt.replace(/\.(test|spec)$/, "");
  }
  return withoutExt;
}

function isKebabCaseStem(stem) {
  return KEBAB_CASE.test(stem);
}

async function walkFiles(startDir, output = []) {
  let entries;
  try {
    entries = await readdir(startDir, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const fullPath = resolve(startDir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, output);
      continue;
    }
    if (!/\.(ts|tsx|mts|mjs)$/.test(entry.name)) continue;
    output.push(fullPath);
  }
  return output;
}

async function main() {
  const violations = [];

  for (const { dir: workspaceParent, subdirs } of SCAN_ROOTS) {
    let workspaces;
    try {
      workspaces = await readdir(workspaceParent, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const workspace of workspaces) {
      if (!workspace.isDirectory()) continue;
      for (const subdir of subdirs) {
        const scanDir = resolve(workspaceParent, workspace.name, subdir);
        const files = await walkFiles(scanDir);
        for (const filePath of files) {
          const relative = toRelative(filePath);
          if (ALLOWLIST.has(relative)) continue;
          const fileName = filePath.split("/").pop() ?? "";
          const stem = fileStem(fileName);
          if (NEXT_RESERVED_STEMS.has(stem)) continue;
          if (!isKebabCaseStem(stem)) {
            violations.push(relative);
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Non-kebab-case source filenames detected (${violations.length}):\n- ${violations.sort().join("\n- ")}`
    );
  }

  console.log("Source filename kebab-case checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
