import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SECURITY_FLOORS = {
  next: "16.2.12",
  react: "19.2.8",
  "react-dom": "19.2.8",
};

const DEP_GROUPS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function parseVersionTuple(version) {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return match.slice(1).map((segment) => Number(segment));
}

function compareVersions(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
}

function isLocalSpecifier(spec) {
  return (
    spec.startsWith("workspace:") ||
    spec.startsWith("file:") ||
    spec.startsWith("link:") ||
    spec.startsWith("npm:")
  );
}

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

    for (const group of DEP_GROUPS) {
      const dependencies = packageJson[group];
      if (!dependencies) continue;

      for (const [dependencyName, specifier] of Object.entries(dependencies)) {
        const floor = SECURITY_FLOORS[dependencyName];
        if (!floor || typeof specifier !== "string") continue;
        if (isLocalSpecifier(specifier)) continue;

        const declared = parseVersionTuple(specifier);
        const minimum = parseVersionTuple(floor);
        if (!declared || !minimum) continue;

        if (compareVersions(declared, minimum) < 0) {
          violations.push({
            packageJsonPath: path.relative(rootDir, packageJsonPath),
            dependencyName,
            specifier,
            floor,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log("Security dependency floors passed.");
    return;
  }

  console.error("Security dependency floor violations detected:");
  for (const violation of violations) {
    console.error(
      `- ${violation.packageJsonPath}: ${violation.dependencyName}@${violation.specifier} < ${violation.floor}`
    );
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("Failed to validate dependency floors:", error);
  process.exit(2);
});
