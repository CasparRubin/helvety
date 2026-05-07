import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const LIFECYCLE_SCRIPT_NAMES = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
];
const ALLOWED_LIFECYCLE_SCRIPTS = new Set([
  // Add "path/to/package.json#scriptName" entries only with explicit approval.
]);

async function getWorkspacePackageJsonPaths(rootDir) {
  const rootPackage = JSON.parse(
    await readFile(path.join(rootDir, "package.json"), "utf8")
  );
  const workspacePatterns = rootPackage.workspaces ?? [];
  const packageJsonPaths = [path.join(rootDir, "package.json")];

  for (const pattern of workspacePatterns) {
    if (!pattern.endsWith("/*")) continue;
    const parentDir = path.join(rootDir, pattern.slice(0, -2));
    const entries = await readdir(parentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      packageJsonPaths.push(path.join(parentDir, entry.name, "package.json"));
    }
  }

  return packageJsonPaths;
}

async function main() {
  const rootDir = process.cwd();
  const packageJsonPaths = await getWorkspacePackageJsonPaths(rootDir);
  const violations = [];

  for (const packageJsonPath of packageJsonPaths) {
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    } catch {
      continue;
    }

    const scripts = packageJson.scripts;
    if (!scripts || typeof scripts !== "object") continue;

    for (const scriptName of LIFECYCLE_SCRIPT_NAMES) {
      const scriptValue = scripts[scriptName];
      if (typeof scriptValue !== "string") continue;

      const relativePath = path.relative(rootDir, packageJsonPath);
      const allowListKey = `${relativePath}#${scriptName}`;
      if (!ALLOWED_LIFECYCLE_SCRIPTS.has(allowListKey)) {
        violations.push({ relativePath, scriptName, scriptValue });
      }
    }
  }

  if (violations.length === 0) {
    console.log("Lifecycle script policy passed.");
    return;
  }

  console.error("Lifecycle script policy violations detected:");
  for (const violation of violations) {
    console.error(
      `- ${violation.relativePath}: disallowed ${violation.scriptName} script -> ${violation.scriptValue}`
    );
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("Failed to validate lifecycle script policy:", error);
  process.exit(2);
});
