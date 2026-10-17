/**
 * Removes local generated artifacts (gitignored). Safe to run anytime.
 * Does not touch source or node_modules.
 */
import { readdirSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = process.env.HELVETY_CLEAN_ROOT
  ? resolve(process.env.HELVETY_CLEAN_ROOT)
  : join(fileURLToPath(new URL(".", import.meta.url)), "..");
const skipCoverageClean = process.env.HELVETY_SKIP_COVERAGE_CLEAN === "1";

/** Directory names removed wherever they appear under the repo (except node_modules). */
const ARTIFACT_DIR_NAMES = new Set([".next", "coverage", ".turbo"]);

/** Directories never traversed while collecting artifacts. */
const SKIP_DIR_NAMES = new Set(["node_modules", ".git"]);

/**
 * @param {string} dir
 * @returns {string[]}
 */
export function collectArtifactDirs(dir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) {
      continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ARTIFACT_DIR_NAMES.has(entry.name)) {
        // Vitest writes coverage to `.tmp` while `test:coverage` runs; do not delete mid-run.
        // Guardrail tests set HELVETY_SKIP_COVERAGE_CLEAN=1 when exercising this script.
        if (
          entry.name === "coverage" &&
          (skipCoverageClean || existsSync(join(abs, ".tmp")))
        ) {
          continue;
        }
        found.push(abs);
        continue;
      }
      found.push(...collectArtifactDirs(abs));
    }
  }
  return found;
}

/** @param {string} absPath */
function repoRelativePath(absPath) {
  return absPath
    .replace(`${repoRoot}\\`, "")
    .replace(`${repoRoot}/`, "")
    .replace(/\\/g, "/");
}

/** @param {string} dir */
function removeDir(dir) {
  try {
    rmSync(dir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
    console.log(`[clean:artifacts] removed ${repoRelativePath(dir)}`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "ENOTEMPTY" || code === "EBUSY" || code === "EPERM") {
      console.log(
        `[clean:artifacts] skipped ${repoRelativePath(dir)} (${code})`
      );
      return;
    }
    throw error;
  }
}

/** @param {string} dir */
export function collectDsStore(dir) {
  /** @type {string[]} */
  const paths = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return paths;
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) {
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

function main() {
  const artifactDirs = collectArtifactDirs(repoRoot);
  for (const dir of artifactDirs) {
    removeDir(dir);
  }

  const dsStorePaths = collectDsStore(repoRoot);
  for (const file of dsStorePaths) {
    rmSync(file, { force: true });
    console.log(`[clean:artifacts] removed ${repoRelativePath(file)}`);
  }

  if (artifactDirs.length === 0 && dsStorePaths.length === 0) {
    console.log("[clean:artifacts] nothing to remove");
  }
}

// Only run when executed directly (tests import the collectors).
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main();
}
