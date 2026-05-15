/**
 * Ensures the monorepo uses AGPL-3.0 and no longer references MIT as Helvety's license.
 *
 * Run: `bun run consistency:license`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN = [
  { label: "MIT License", re: /\bMIT License\b/ },
  { label: "MIT-licensed", re: /\bMIT-licensed\b/i },
  { label: '"license": "MIT"', re: /"license":\s*"MIT"/ },
  { label: "under the MIT", re: /\bunder the MIT\b/i },
  { label: "where the repo ships", re: /where the repo ships/i },
  {
    label: "unless the repository LICENSE",
    re: /unless the repository LICENSE/i,
  },
  { label: "Free and open source", re: /Free and open source/ },
  { label: ">Open Source<", re: />Open Source</ },
  {
    label: "Open-source monorepo for helvety",
    re: /Open-source monorepo for helvety/i,
  },
  {
    label: "Designed and built in Switzerland",
    re: /Designed and built in Switzerland/,
  },
];

const SCAN_ROOTS = ["apps", "packages", "scripts", "docs", "README.md"];
const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".mjs",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "ort",
]);

function collectFiles(entryPath) {
  const stat = statSync(entryPath);
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.has(path.extname(entryPath))) {
      return [entryPath];
    }
    return [];
  }
  if (!stat.isDirectory()) {
    return [];
  }
  if (SKIP_DIRS.has(path.basename(entryPath))) {
    return [];
  }
  const files = [];
  for (const name of readdirSync(entryPath)) {
    files.push(...collectFiles(path.join(entryPath, name)));
  }
  return files;
}

function scanPaths() {
  const files = [];
  for (const rel of SCAN_ROOTS) {
    const abs = path.join(root, rel);
    const stat = statSync(abs);
    if (stat.isFile()) {
      if (SCAN_EXTENSIONS.has(path.extname(abs))) {
        files.push(abs);
      }
      continue;
    }
    files.push(...collectFiles(abs));
  }
  return [...new Set(files)];
}

function checkLicenseFile() {
  const licensePath = path.join(root, "LICENSE");
  const text = readFileSync(licensePath, "utf8");
  if (!text.includes("GNU AFFERO GENERAL PUBLIC LICENSE")) {
    console.error(
      "LICENSE must contain the GNU AFFERO GENERAL PUBLIC LICENSE text."
    );
    return false;
  }
  if (!text.includes("Copyright (C) 2026 Helvety by Rubin")) {
    console.error("LICENSE must include the Helvety copyright notice.");
    return false;
  }
  return true;
}

function checkForbiddenReferences() {
  const violations = [];
  const skipFiles = new Set([
    path.join(root, "scripts/check-license-consistency.mjs"),
    path.join(root, "packages/shared/src/customer-copy-guardrails.ts"),
    path.join(root, "LICENSE"),
  ]);

  for (const filePath of scanPaths()) {
    if (skipFiles.has(filePath)) {
      continue;
    }
    const rel = path.relative(root, filePath);
    if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) {
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    for (const { label, re } of FORBIDDEN) {
      if (re.test(content)) {
        violations.push({ rel, label });
      }
    }
  }

  if (violations.length > 0) {
    console.error("Forbidden legacy license references found:");
    for (const { rel, label } of violations) {
      console.error(`  ${rel} (${label})`);
    }
    return false;
  }
  return true;
}

function checkNoPerAppLicenseDuplicates() {
  const appsDir = path.join(root, "apps");
  const duplicates = [];
  for (const app of readdirSync(appsDir)) {
    const licensePath = path.join(appsDir, app, "LICENSE");
    try {
      if (statSync(licensePath).isFile()) {
        duplicates.push(path.relative(root, licensePath));
      }
    } catch {
      // no LICENSE in app dir
    }
  }
  if (duplicates.length > 0) {
    console.error(
      "Per-app LICENSE files should be removed; use the root LICENSE only:"
    );
    for (const rel of duplicates) {
      console.error(`  ${rel}`);
    }
    return false;
  }
  return true;
}

function main() {
  const ok =
    checkLicenseFile() &&
    checkForbiddenReferences() &&
    checkNoPerAppLicenseDuplicates();
  if (!ok) {
    process.exit(1);
  }
  console.log("license consistency OK (AGPL-3.0, no MIT references)");
}

main();
