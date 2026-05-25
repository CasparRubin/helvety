/**
 * Fail the build if superseded Power Automate extension name strings appear outside
 * an explicit allowlist (Store redirects, redirect tests, ops README).
 *
 * Forbidden patterns and allowlist paths are imported from
 * `packages/shared/src/retired-power-platform-extension-naming.ts`.
 *
 * Run: `bun run consistency:project-naming`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS,
  RETIRED_HELVETY_EXTENSION_NAME_PATTERNS,
} from "../packages/shared/src/retired-power-platform-extension-naming.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const skipDirNames = new Set([
  "node_modules",
  "dist",
  ".git",
  ".next",
  ".turbo",
  "coverage",
]);

const allowlistPaths = new Set(RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS);
const forbidden = RETIRED_HELVETY_EXTENSION_NAME_PATTERNS;

const scanExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".html",
  ".css",
  ".svg",
  ".yml",
  ".yaml",
  ".txt",
]);

const maxBytes = 512 * 1024;

/**
 * @param {string} dir
 * @param {string[]} hits
 */
function walk(dir, hits) {
  const names = readdirSync(dir);
  for (const name of names) {
    const full = join(dir, name);
    const rel = relative(root, full).replaceAll("\\", "/");
    if (allowlistPaths.has(rel)) continue;
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (skipDirNames.has(name)) continue;
      walk(full, hits);
      continue;
    }
    if (!st.isFile() || st.size > maxBytes) continue;
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot) : "";
    if (!scanExtensions.has(ext)) continue;
    let text;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const { label, re } of forbidden) {
      if (re.test(text)) {
        hits.push(`${rel}: contains ${label}`);
      }
    }
  }
}

const hits = [];
walk(root, hits);
if (hits.length > 0) {
  console.error(
    "verify-project-naming: forbidden superseded name strings found:\n" +
      hits.join("\n")
  );
  process.exit(1);
}
console.log(
  "verify-project-naming: ok (no forbidden superseded name strings)."
);
