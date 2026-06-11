import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { validateUiTailwindBuildDependencies } from "./postcss-app-expectations.mjs";

const ROOT_DIR = process.cwd();
const WORKSPACE_DIRS = ["apps", "packages"];
const DEV_DEPS_PACKAGE = "packages/dev-deps/package.json";

/** Toolchain packages owned by @helvety/dev-deps — not duplicated in other workspaces. */
const DEV_DEPS_MANAGED = new Set([
  "eslint",
  "typescript",
  "vitest",
  "@vitest/coverage-v8",
  "prettier",
  "prettier-plugin-tailwindcss",
  "@testing-library/jest-dom",
  "@testing-library/react",
  "jsdom",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@tailwindcss/postcss",
  "tailwindcss",
  "shadcn",
  "babel-plugin-react-compiler",
]);

const REQUIRED_VERSION_BY_DEP = new Map([
  ["next", "^16.2.9"],
  ["react", "^19.2.7"],
  ["react-dom", "^19.2.7"],
  ["typescript", "^6"],
  ["eslint", "^10.4.1"],
  ["vitest", "^4.1.8"],
  ["@vitest/coverage-v8", "^4.1.8"],
  ["@testing-library/jest-dom", "^6.9.1"],
  ["@testing-library/react", "^16.3.2"],
  ["jsdom", "29.1.1"],
  ["@supabase/supabase-js", "^2.108.1"],
  ["date-fns", "^4.4.0"],
  ["@supabase/ssr", "^0.12.0"],
  ["@simplewebauthn/server", "^13.3.1"],
  ["@simplewebauthn/browser", "^13.3.0"],
  ["zod", "^4.4.3"],
  ["prettier", "^3.8.4"],
  ["prettier-plugin-tailwindcss", "^0.8.0"],
  ["tailwindcss", "^4.3.0"],
  ["@tailwindcss/postcss", "^4.3.0"],
  ["shadcn", "^4.11.0"],
  ["babel-plugin-react-compiler", "^1.0.0"],
  ["@types/node", "^24.13.2"],
  ["lucide-react", "^1.17.0"],
  ["sonner", "^2.0.7"],
  ["@tiptap/pm", "^3.26.0"],
  ["@tiptap/react", "^3.26.0"],
  ["@types/three", "0.184.1"],
  ["react-day-picker", "^10.0.1"],
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
    manifest.devDependencies?.[dependencyName] ??
    manifest.peerDependencies?.[dependencyName]
  );
}

function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function usesDevDepsBundle(manifest) {
  return manifest.devDependencies?.["@helvety/dev-deps"] === "workspace:*";
}

async function main() {
  const manifestPaths = await collectWorkspacePackageJsonPaths();
  const devDepsManifestPath = path.join(ROOT_DIR, DEV_DEPS_PACKAGE);
  const errors = [];

  const rootManifest = await readManifest(path.join(ROOT_DIR, "package.json"));
  const rootDependencies = rootManifest.dependencies ?? {};
  if (Object.keys(rootDependencies).length > 0) {
    errors.push(
      `package.json: remove root "dependencies" (found ${Object.keys(rootDependencies).join(", ")}); Helvety root must only use devDependencies plus overrides`
    );
  }

  const devDepsManifest = await readManifest(devDepsManifestPath);
  for (const dependencyName of DEV_DEPS_MANAGED) {
    const expectedVersion = REQUIRED_VERSION_BY_DEP.get(dependencyName);
    if (!expectedVersion) continue;

    const actualVersion = getDependencyVersion(devDepsManifest, dependencyName);
    if (!actualVersion) {
      errors.push(
        `${DEV_DEPS_PACKAGE}: missing ${dependencyName} (expected ${expectedVersion})`
      );
      continue;
    }
    if (actualVersion !== expectedVersion) {
      errors.push(
        `${DEV_DEPS_PACKAGE}: ${dependencyName} is ${actualVersion} (expected ${expectedVersion})`
      );
    }
  }

  for (const manifestPath of manifestPaths) {
    if (relativePath(manifestPath) === DEV_DEPS_PACKAGE) continue;

    const manifest = await readManifest(manifestPath);
    const rel = relativePath(manifestPath);

    for (const dependencyName of DEV_DEPS_MANAGED) {
      const actualVersion = getDependencyVersion(manifest, dependencyName);
      if (!actualVersion) continue;

      if (rel === "packages/config/package.json") {
        if (dependencyName === "eslint" && manifest.dependencies?.eslint) {
          continue;
        }
        if (dependencyName === "vitest" && manifest.peerDependencies?.vitest) {
          continue;
        }
      }

      if (
        rel === "packages/ui/package.json" &&
        (dependencyName === "tailwindcss" ||
          dependencyName === "@tailwindcss/postcss") &&
        manifest.dependencies?.[dependencyName]
      ) {
        continue;
      }

      errors.push(
        `${rel}: ${dependencyName} must not be declared directly; use @helvety/dev-deps (found ${actualVersion})`
      );
    }

    const hasDevDeps = usesDevDepsBundle(manifest);
    const needsToolchain =
      manifest.scripts?.lint ||
      manifest.scripts?.test ||
      manifest.scripts?.["type-check"];

    const isApp = rel.startsWith("apps/");
    const isLibraryPackage =
      rel.startsWith("packages/") &&
      rel !== "packages/config/package.json" &&
      rel !== "packages/dev-deps/package.json" &&
      rel !== "packages/shared/package.json";

    if (isApp || isLibraryPackage) {
      const hasConfigInDevDeps =
        manifest.devDependencies?.["@helvety/config"] === "workspace:*";
      if (!hasConfigInDevDeps) {
        errors.push(
          `${rel}: add "@helvety/config": "workspace:*" to devDependencies`
        );
      }
      if (!hasDevDeps && needsToolchain) {
        errors.push(
          `${rel}: add "@helvety/dev-deps": "workspace:*" to devDependencies`
        );
      }
    }

    if (rel === "packages/shared/package.json" && !hasDevDeps) {
      errors.push(
        `${rel}: add "@helvety/dev-deps": "workspace:*" to devDependencies`
      );
    }

    for (const [dependencyName, expectedVersion] of REQUIRED_VERSION_BY_DEP) {
      if (DEV_DEPS_MANAGED.has(dependencyName)) continue;

      const actualVersion = getDependencyVersion(manifest, dependencyName);
      if (!actualVersion) continue;

      if (actualVersion !== expectedVersion) {
        errors.push(
          `${rel}: ${dependencyName} is ${actualVersion} (expected ${expectedVersion})`
        );
      }
    }
  }

  const uiManifest = await readManifest(
    path.join(ROOT_DIR, "packages/ui/package.json")
  );
  errors.push(...validateUiTailwindBuildDependencies(uiManifest));

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
