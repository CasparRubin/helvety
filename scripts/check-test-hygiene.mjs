import { access, readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const rootDir = process.cwd();
const WORKSPACE_DIRS = ["apps", "packages"];
const TEST_FILE_SUFFIX = [
  ".test.ts",
  ".test.tsx",
  ".test.mjs",
  ".spec.ts",
  ".spec.tsx",
  ".spec.mjs",
];
const SKIP_DIR_NAMES = new Set(["node_modules", ".next", ".turbo", "dist"]);
const FORBIDDEN_PATTERNS = [
  { name: "test.only", regex: /\b(?:it|test)\.only\(/ },
  { name: "test.skip", regex: /\b(?:it|test)\.skip\(/ },
  { name: "test.todo", regex: /\b(?:it|test)\.todo\(/ },
  { name: "describe.only", regex: /\bdescribe\.only\(/ },
  { name: "describe.skip", regex: /\bdescribe\.skip\(/ },
];

/** Required lines for workspace vitest.setup.ts (jest-dom types + shared setup). */
const CANONICAL_VITEST_SETUP_LINES = [
  '/// <reference types="@testing-library/jest-dom/vitest" />',
  'import "@helvety/config/vitest.setup";',
];

function isCanonicalVitestSetup(content) {
  const lines = content.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length !== CANONICAL_VITEST_SETUP_LINES.length) return false;
  return lines.every(
    (line, index) => line === CANONICAL_VITEST_SETUP_LINES[index]
  );
}

async function listWorkspacePackageJsonFiles() {
  const files = [];
  for (const workspaceDir of WORKSPACE_DIRS) {
    const workspacePath = resolve(rootDir, workspaceDir);
    const entries = await readdir(workspacePath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      files.push(resolve(workspacePath, entry.name, "package.json"));
    }
  }
  return files;
}

async function collectTestFiles(startDir, output = []) {
  const entries = await readdir(startDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const fullPath = resolve(startDir, entry.name);
    if (entry.isDirectory()) {
      await collectTestFiles(fullPath, output);
      continue;
    }
    if (TEST_FILE_SUFFIX.some((suffix) => entry.name.endsWith(suffix))) {
      output.push(fullPath);
    }
  }
  return output;
}

async function hasTestFiles(startDir) {
  const files = await collectTestFiles(startDir, []);
  return files.length > 0;
}

function toRelative(filePath) {
  return relative(rootDir, filePath).replace(/\\/g, "/");
}

function extractMajor(versionRange) {
  if (!versionRange) return null;
  const match = versionRange.match(/(\d+)/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readDevDepsToolchainVersions() {
  const devDepsPath = resolve(rootDir, "packages/dev-deps/package.json");
  const content = await readFile(devDepsPath, "utf8");
  const pkg = JSON.parse(content);
  return {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
}

async function main() {
  const packageJsonFiles = await listWorkspacePackageJsonFiles();
  const devDepsToolchain = await readDevDepsToolchainVersions();
  const issues = [];

  const vitestVersions = new Map();
  const jestDomVersions = new Map();
  const testingLibraryReactVersions = new Map();
  const jsdomVersions = new Map();

  for (const packageJsonPath of packageJsonFiles) {
    const content = await readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(content);
    const relativePackageJsonPath = toRelative(packageJsonPath);
    const workspaceRoot = resolve(packageJsonPath, "..");

    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    };

    const usesDevDepsBundle =
      pkg.devDependencies?.["@helvety/dev-deps"] === "workspace:*";
    const vitestVersion =
      allDeps.vitest ??
      (usesDevDepsBundle ? devDepsToolchain.vitest : undefined);
    if (vitestVersion) {
      vitestVersions.set(relativePackageJsonPath, vitestVersion);
      const major = extractMajor(vitestVersion);
      if (major !== null && major < 4) {
        issues.push(
          `${relativePackageJsonPath} uses vitest ${vitestVersion}. Expected vitest v4+ for Node 24.`
        );
      }
    }

    const jestDomVersion =
      allDeps["@testing-library/jest-dom"] ??
      (usesDevDepsBundle
        ? devDepsToolchain["@testing-library/jest-dom"]
        : undefined);
    if (jestDomVersion) {
      jestDomVersions.set(relativePackageJsonPath, jestDomVersion);
    }

    const testingLibraryReactVersion =
      allDeps["@testing-library/react"] ??
      (usesDevDepsBundle
        ? devDepsToolchain["@testing-library/react"]
        : undefined);
    if (testingLibraryReactVersion) {
      testingLibraryReactVersions.set(
        relativePackageJsonPath,
        testingLibraryReactVersion
      );
    }

    const jsdomVersion =
      allDeps.jsdom ?? (usesDevDepsBundle ? devDepsToolchain.jsdom : undefined);
    if (jsdomVersion) {
      jsdomVersions.set(relativePackageJsonPath, jsdomVersion);
      const major = extractMajor(jsdomVersion);
      if (major !== null && major < 24) {
        issues.push(
          `${relativePackageJsonPath} uses jsdom ${jsdomVersion}. Expected jsdom v24+ with Vitest 4 / Node 24.`
        );
      }
    }

    const testScript = pkg.scripts?.test;
    const usesVitest =
      typeof testScript === "string" && /vitest/.test(testScript);
    if (usesVitest && (await hasTestFiles(workspaceRoot))) {
      const vitestConfigCandidates = [
        resolve(workspaceRoot, "vitest.config.ts"),
        resolve(workspaceRoot, "vitest.config.mts"),
        resolve(workspaceRoot, "vitest.config.mjs"),
        resolve(workspaceRoot, "vitest.mjs"),
      ];
      const vitestSetupPath = resolve(workspaceRoot, "vitest.setup.ts");
      const hasVitestConfig = (
        await Promise.all(
          vitestConfigCandidates.map((candidate) => fileExists(candidate))
        )
      ).some(Boolean);
      if (!hasVitestConfig) {
        issues.push(
          `${relativePackageJsonPath} has a Vitest test script but is missing a Vitest config file (vitest.config.ts|vitest.config.mts|vitest.config.mjs|vitest.mjs)`
        );
      }
      if (!(await fileExists(vitestSetupPath))) {
        issues.push(
          `${relativePackageJsonPath} has a Vitest test script but is missing vitest.setup.ts`
        );
      } else {
        const setupContent = (await readFile(vitestSetupPath, "utf8")).replace(
          /\r\n/g,
          "\n"
        );
        if (!isCanonicalVitestSetup(setupContent)) {
          issues.push(
            `${toRelative(vitestSetupPath)} must match the canonical Vitest setup (jest-dom types reference + import @helvety/config/vitest.setup).`
          );
        }
      }
    }
  }

  const uniqueVitestVersions = new Set(vitestVersions.values());
  if (uniqueVitestVersions.size > 1) {
    issues.push(
      `Vitest version drift detected: ${Array.from(uniqueVitestVersions).join(", ")}`
    );
  }

  const uniqueJestDomVersions = new Set(jestDomVersions.values());
  if (uniqueJestDomVersions.size > 1) {
    issues.push(
      `@testing-library/jest-dom version drift detected: ${Array.from(uniqueJestDomVersions).join(", ")}`
    );
  }

  const uniqueTestingLibraryReactVersions = new Set(
    testingLibraryReactVersions.values()
  );
  if (uniqueTestingLibraryReactVersions.size > 1) {
    issues.push(
      `@testing-library/react version drift detected: ${Array.from(uniqueTestingLibraryReactVersions).join(", ")}`
    );
  }

  const uniqueJsdomVersions = new Set(jsdomVersions.values());
  if (uniqueJsdomVersions.size > 1) {
    issues.push(
      `jsdom version drift detected: ${Array.from(uniqueJsdomVersions).join(", ")}`
    );
  }

  const testFiles = [
    ...(await collectTestFiles(resolve(rootDir, "apps"))),
    ...(await collectTestFiles(resolve(rootDir, "packages"))),
  ];

  for (const testFile of testFiles) {
    const content = await readFile(testFile, "utf8");
    for (const { name, regex } of FORBIDDEN_PATTERNS) {
      if (regex.test(content)) {
        issues.push(
          `${toRelative(testFile)} contains ${name}; remove focused/skipped/todo tests.`
        );
      }
    }
  }

  const appsDir = resolve(rootDir, "apps");
  const appEntries = await readdir(appsDir, { withFileTypes: true });
  for (const entry of appEntries) {
    if (!entry.isDirectory()) continue;
    const appRoot = resolve(appsDir, entry.name);
    const proxyPath = resolve(appRoot, "proxy.ts");
    if (!(await fileExists(proxyPath))) continue;
    const proxyTestPath = resolve(appRoot, "proxy.test.ts");
    if (!(await fileExists(proxyTestPath))) {
      issues.push(
        `apps/${entry.name}/proxy.ts exists but apps/${entry.name}/proxy.test.ts is missing (required by test hygiene; web may use gateway-specific assertions).`
      );
    }

    for (const requiredTest of [
      "app/layout-metadata.test.ts",
      "app/layout-shell-providers.test.ts",
      "app/seo-routes.test.ts",
    ]) {
      const requiredPath = resolve(appRoot, requiredTest);
      if (!(await fileExists(requiredPath))) {
        issues.push(
          `apps/${entry.name}/${requiredTest} is missing (required app test floor; see docs/app-consistency-checklist.md).`
        );
      }
    }

    for (const listRouteTest of [
      "app/api/items/route.test.ts",
      "app/api/contacts/route.test.ts",
      "app/api/docs/route.test.ts",
    ]) {
      const routeTestPath = resolve(appRoot, listRouteTest);
      if (!(await fileExists(routeTestPath))) continue;
      const routeTestSource = await readFile(routeTestPath, "utf8");
      if (!routeTestSource.includes("./[id]/route")) {
        issues.push(
          `apps/${entry.name}/${listRouteTest} must import ./[id]/route for detail-route contract tests (see docs/app-consistency-checklist.md).`
        );
      }
      if (
        !routeTestSource.includes("@helvety/shared/dashboard-prefetch") ||
        !routeTestSource.includes("exceed")
      ) {
        issues.push(
          `apps/${entry.name}/${listRouteTest} must cover prefetch overflow via @helvety/shared/dashboard-prefetch constants (see sibling contacts route.test.ts).`
        );
      }
    }

    const linksLibraryRouteTest = resolve(
      appRoot,
      "app/api/library/route.test.ts"
    );
    if (await fileExists(linksLibraryRouteTest)) {
      const linksRouteTestSource = await readFile(
        linksLibraryRouteTest,
        "utf8"
      );
      if (
        !linksRouteTestSource.includes("@helvety/shared/dashboard-prefetch") ||
        !linksRouteTestSource.includes("exceed")
      ) {
        issues.push(
          `apps/${entry.name}/app/api/library/route.test.ts must cover prefetch overflow via @helvety/shared/dashboard-prefetch constants.`
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Test hygiene checks failed:\n- ${issues.join("\n- ")}`);
  }

  console.log(
    `Test hygiene checks passed (${testFiles.length} test files scanned, ${packageJsonFiles.length} workspace manifests checked).`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
