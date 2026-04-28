import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const WORKSPACE_DIRS = ["apps", "packages"];
const REQUIRED_VERSION_BY_DEP = new Map([
  ["next", "^16.2.4"],
  ["react", "^19.2.5"],
  ["react-dom", "^19.2.5"],
  ["typescript", "^5"],
  ["eslint", "^9.39.4"],
  ["vitest", "^4.1.5"],
  ["@vitest/coverage-v8", "^4.1.5"],
  ["@supabase/supabase-js", "^2.104.1"],
  ["@supabase/ssr", "^0.10.2"],
  ["@simplewebauthn/server", "^13.3.0"],
  ["@simplewebauthn/browser", "^13.3.0"],
  ["zod", "^4.3.6"],
  ["prettier-plugin-tailwindcss", "^0.7.3"],
]);

/**
 * Collect package.json files from apps/* and packages/*.
 */
async function collectWorkspacePackageJsonPaths() {
  const paths = [path.join(ROOT_DIR, "package.json")];

  for (const baseDir of WORKSPACE_DIRS) {
    const absoluteBaseDir = path.join(ROOT_DIR, baseDir);
    const entries = await readdir(absoluteBaseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      paths.push(path.join(absoluteBaseDir, entry.name, "package.json"));
    }
  }

  return paths;
}

/**
 * Read and parse package.json.
 */
async function readManifest(manifestPath) {
  const content = await readFile(manifestPath, "utf8");
  return JSON.parse(content);
}

function getDependencyVersion(manifest, dependencyName) {
  return (
    manifest.dependencies?.[dependencyName] ??
    manifest.devDependencies?.[dependencyName]
  );
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath);
}

async function main() {
  const manifestPaths = await collectWorkspacePackageJsonPaths();
  const errors = [];

  for (const manifestPath of manifestPaths) {
    const manifest = await readManifest(manifestPath);
    for (const [dependencyName, expectedVersion] of REQUIRED_VERSION_BY_DEP) {
      const actualVersion = getDependencyVersion(manifest, dependencyName);
      if (!actualVersion) continue;

      if (actualVersion !== expectedVersion) {
        errors.push(
          `${relativePath(manifestPath)}: ${dependencyName} is ${actualVersion} (expected ${expectedVersion})`
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Workspace dependency version drift detected:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("No workspace dependency drift detected.");
}

await main();
