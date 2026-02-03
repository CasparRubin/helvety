/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sync shared code from this repo (helvety.com) to helvety-auth, helvety-store, helvety-pdf.
 *
 * Source of truth: this repo. Run from helvety.com root: node scripts/sync-shared.js
 *
 * Synced paths (must match .cursor/rules/shared-code-patterns.mdc):
 *   - proxy.ts
 *   - scripts/generate-version.js
 *   - lib/utils.ts, lib/logger.ts, lib/constants.ts (helvety-auth and helvety-store only; helvety-pdf keeps app-specific constants)
 *   - lib/auth-errors.ts, lib/auth-logger.ts, lib/auth-redirect.ts, lib/rate-limit.ts, lib/csrf.ts
 *   - lib/crypto/* (entire directory)
 *   - components/theme-provider.tsx, components/theme-switcher.tsx, components/app-switcher.tsx
 *   - __tests__/utils/server-only-mock.ts
 *
 * Test mock-factories.ts is not synced (apps may add app-specific mocks).
 */
const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = path.join(__dirname, "..");
const TARGET_REPOS = ["helvety-auth", "helvety-store", "helvety-pdf"];

const FILES = [
  "proxy.ts",
  "scripts/generate-version.js",
  "lib/utils.ts",
  "lib/logger.ts",
  "lib/constants.ts",
  "lib/auth-errors.ts",
  "lib/auth-logger.ts",
  "lib/auth-redirect.ts",
  "lib/rate-limit.ts",
  "lib/csrf.ts",
  "components/theme-provider.tsx",
  "components/theme-switcher.tsx",
  "components/app-switcher.tsx",
  "__tests__/utils/server-only-mock.ts",
];

const DIRS = ["lib/crypto"];

/** Files to skip per target (e.g. helvety-pdf keeps its own lib/constants.ts with app-specific exports). */
const TARGET_SKIP_FILES = {
  "helvety-pdf": ["lib/constants.ts"],
};

function copyFile(srcRoot, destRoot, file, targetRepo) {
  const skipList = TARGET_SKIP_FILES[targetRepo];
  if (skipList && skipList.includes(file)) {
    console.warn(`  Skip (target-specific): ${file}`);
    return;
  }
  const src = path.join(srcRoot, file);
  const dest = path.join(destRoot, file);
  if (!fs.existsSync(src)) {
    console.warn(`Skip (missing): ${file}`);
    return;
  }
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`  ${file}`);
}

function copyDirRecursive(srcRoot, destRoot, dir) {
  const srcDir = path.join(srcRoot, dir);
  const destDir = path.join(destRoot, dir);
  if (!fs.existsSync(srcDir)) {
    console.warn(`Skip (missing): ${dir}/`);
    return;
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcRoot, destRoot, path.join(dir, entry.name));
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ${path.join(dir, entry.name)}`);
    }
  }
}

function syncTo(targetRoot, targetRepo) {
  for (const file of FILES) {
    copyFile(SOURCE_ROOT, targetRoot, file, targetRepo);
  }
  for (const dir of DIRS) {
    copyDirRecursive(SOURCE_ROOT, targetRoot, dir);
  }
}

const parentDir = path.join(SOURCE_ROOT, "..");
for (const repo of TARGET_REPOS) {
  const targetRoot = path.join(parentDir, repo);
  if (!fs.existsSync(targetRoot)) {
    console.warn(`Target not found: ${targetRoot}`);
    continue;
  }
  console.log(`Syncing to ${repo}...`);
  syncTo(targetRoot, repo);
  console.log("");
}

console.log("Done. Run format/lint/tests in each repo after syncing.");
