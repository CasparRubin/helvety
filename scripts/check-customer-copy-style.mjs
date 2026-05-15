/**
 * Fails when tracked source/docs contain U+2014 em-dashes (use commas or periods).
 *
 * Run: `bun run consistency:customer-copy`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EM_DASH = "\u2014";

const SCAN_ROOTS = ["apps", "packages", "scripts", "docs", "README.md"];
const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".mjs",
  ".css",
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
const SKIP_FILES = new Set([
  path.join(root, "packages/shared/src/customer-copy-guardrails.ts"),
  path.join(root, "scripts/check-customer-copy-style.mjs"),
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

function main() {
  const violations = [];
  for (const filePath of scanPaths()) {
    if (SKIP_FILES.has(filePath)) {
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    if (content.includes(EM_DASH)) {
      violations.push(path.relative(root, filePath));
    }
  }
  if (violations.length > 0) {
    console.error(
      "Em-dash (U+2014) found; use commas, periods, or parentheses:"
    );
    for (const rel of violations.sort()) {
      console.error(`  ${rel}`);
    }
    process.exit(1);
  }
  console.log("customer copy style OK (no em-dashes in tracked files)");
}

main();
