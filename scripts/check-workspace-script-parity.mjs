/**
 * Monorepo guardrail (`ci:check`): workspaces with lint/test scripts must also
 * expose lint:fix and test:coverage for consistent local and CI workflows.
 *
 * Enforced via `bun run consistency:workspace-scripts`.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

/**
 * @param {string} rootDirPath
 * @returns {Promise<string[]>}
 */
async function getWorkspacePackageJsonPaths(rootDirPath) {
  const rootPackage = JSON.parse(
    await readFile(resolve(rootDirPath, "package.json"), "utf8")
  );
  const workspacePatterns = rootPackage.workspaces ?? [];
  const packageJsonPaths = [resolve(rootDirPath, "package.json")];

  for (const pattern of workspacePatterns) {
    if (!pattern.endsWith("/*")) continue;
    const parentDir = resolve(rootDirPath, pattern.slice(0, -2));
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(parentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      packageJsonPaths.push(resolve(parentDir, entry.name, "package.json"));
    }
  }

  return packageJsonPaths;
}

/**
 * @param {string} relativePath
 * @param {Record<string, string> | undefined} scripts
 * @returns {string[]}
 */
export function verifyWorkspaceScriptParity(relativePath, scripts) {
  if (!scripts || typeof scripts !== "object") {
    return [];
  }

  const violations = [];
  if (scripts.lint && !scripts["lint:fix"]) {
    violations.push(`${relativePath}: has "lint" but missing "lint:fix"`);
  }
  if (scripts.test && !scripts["test:coverage"]) {
    violations.push(`${relativePath}: has "test" but missing "test:coverage"`);
  }
  return violations;
}

async function main() {
  const packageJsonPaths = await getWorkspacePackageJsonPaths(rootDir);
  const violations = [];

  for (const packageJsonPath of packageJsonPaths) {
    if (packageJsonPath === resolve(rootDir, "package.json")) {
      continue;
    }
    const relativePath = packageJsonPath
      .replace(`${rootDir}\\`, "")
      .replace(`${rootDir}/`, "");
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    } catch {
      continue;
    }
    violations.push(
      ...verifyWorkspaceScriptParity(relativePath, packageJson.scripts)
    );
  }

  if (violations.length > 0) {
    throw new Error(
      `Workspace script parity violations:\n${violations.map((v) => `  - ${v}`).join("\n")}`
    );
  }

  console.log("Workspace script parity checks passed.");
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
