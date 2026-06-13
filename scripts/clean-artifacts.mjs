/**
 * Removes local generated artifacts (gitignored). Safe to run anytime.
 * Does not touch source, node_modules, or supabase/supabase.json.
 */
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Directory names removed wherever they appear under the repo (except node_modules). */
const ARTIFACT_DIR_NAMES = new Set([
  "coverage",
  ".turbo",
  "test-results",
  "playwright-report",
]);

/**
 * @param {string} dir
 * @returns {string[]}
 */
function collectArtifactDirs(dir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ARTIFACT_DIR_NAMES.has(entry.name)) {
        found.push(abs);
        continue;
      }
      found.push(...collectArtifactDirs(abs));
    }
  }
  return found;
}

/** @param {string} dir */
function removeDir(dir) {
  rmSync(dir, { recursive: true, force: true });
  console.log(`[clean:artifacts] removed ${dir.replace(`${repoRoot}/`, "")}`);
}

/** @param {string} dir */
function collectDsStore(dir) {
  /** @type {string[]} */
  const paths = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return paths;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...collectDsStore(abs));
    } else if (entry.name === ".DS_Store") {
      paths.push(abs);
    }
  }
  return paths;
}

const artifactDirs = collectArtifactDirs(repoRoot);
for (const dir of artifactDirs) {
  removeDir(dir);
}

const dsStorePaths = collectDsStore(repoRoot);
for (const file of dsStorePaths) {
  rmSync(file, { force: true });
  console.log(`[clean:artifacts] removed ${file.replace(`${repoRoot}/`, "")}`);
}

if (artifactDirs.length === 0 && dsStorePaths.length === 0) {
  console.log("[clean:artifacts] nothing to remove");
}
