/**
 * Zone modernization checks (loading matrix, layout JSX, optimizePackageImports,
 * API route tests, instrumentation env wiring).
 */
import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const rootDir = process.cwd();
const appsDir = resolve(rootDir, "apps");

/** Repo-relative path with forward slashes (stable on Windows and POSIX). */
function toPosixRelative(absolutePath) {
  return relative(rootDir, absolutePath).replace(/\\/g, "/");
}

/** @type {Record<string, { rootLoading: string }>} */
const LOADING_MATRIX = {
  web: { rootLoading: "HelvetyShellRouteLoading" },
  auth: { rootLoading: "HelvetyShellRouteLoading" },
  store: { rootLoading: "HelvetyShellRouteLoading" },
  pdf: { rootLoading: "LoadingSpinner" },
  "image-upscaler": { rootLoading: "LoadingSpinner" },
  "image-editor": { rootLoading: "LoadingSpinner" },
  ocr: { rootLoading: "LoadingSpinner" },
  tasks: { rootLoading: "E2eeShellRouteLoading" },
  contacts: { rootLoading: "E2eeShellRouteLoading" },
  notes: { rootLoading: "E2eeShellRouteLoading" },
  links: { rootLoading: "E2eeShellRouteLoading" },
};

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(rootDir, relativePath), "utf8"));
}

async function collectRouteFiles(appDir) {
  const apiDir = resolve(appDir, "app/api");
  const files = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.name === "route.ts") {
        files.push(fullPath);
      }
    }
  }
  try {
    await walk(apiDir);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return files;
    }
    throw error;
  }
  return files;
}

async function main() {
  const uiPackageJson = await readJson("packages/ui/package.json");
  const uiDependencyNames = new Set(
    Object.keys(uiPackageJson.dependencies ?? {})
  );

  const appEntries = await readdir(appsDir, { withFileTypes: true });

  for (const entry of appEntries.filter((item) => item.isDirectory())) {
    const appName = entry.name;
    const appDir = resolve(appsDir, appName);

    const loadingPath = resolve(appDir, "app/loading.tsx");
    const loadingSource = await readFile(loadingPath, "utf8");
    const expected = LOADING_MATRIX[appName]?.rootLoading;
    if (!expected) {
      throw new Error(`Missing loading matrix entry for apps/${appName}.`);
    }
    if (!loadingSource.includes(expected)) {
      throw new Error(
        `apps/${appName}/app/loading.tsx must re-export ${expected} (see docs/app-consistency-checklist.md).`
      );
    }

    const layoutPath = resolve(appDir, "app/layout.tsx");
    const layoutSource = await readFile(layoutPath, "utf8");
    if (/return\s+HelvetyPublicShellRootLayout\s*\(/.test(layoutSource)) {
      throw new Error(
        `apps/${appName}/app/layout.tsx must use JSX <HelvetyPublicShellRootLayout>, not a function call.`
      );
    }

    const nextConfigPath = resolve(appDir, "next.config.ts");
    const nextConfigSource = await readFile(nextConfigPath, "utf8");
    const packageJson = await readJson(`apps/${appName}/package.json`);
    const depNames = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
      ...uiDependencyNames,
    ]);
    const optimizeMatch = nextConfigSource.match(
      /optimizePackageImports:\s*\[([\s\S]*?)\]/u
    );
    if (optimizeMatch?.[1]) {
      const imports = [...optimizeMatch[1].matchAll(/["']([^"']+)["']/gu)].map(
        (match) => match[1]
      );
      for (const pkg of imports) {
        if (!depNames.has(pkg)) {
          throw new Error(
            `apps/${appName}/next.config.ts lists optimizePackageImports entry "${pkg}" that is not declared in apps/${appName}/package.json.`
          );
        }
      }
    }

    const envPath = resolve(appDir, "lib/env.ts");
    const instrumentationPath = resolve(appDir, "instrumentation.ts");
    let hasEnv = false;
    try {
      await readFile(envPath, "utf8");
      hasEnv = true;
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      )) {
        throw error;
      }
    }
    if (hasEnv) {
      const instrumentationSource = await readFile(instrumentationPath, "utf8");
      if (!/getValidated\w+Env\s*\(/.test(instrumentationSource)) {
        throw new Error(
          `apps/${appName}/instrumentation.ts must call getValidated*Env() when lib/env.ts exists.`
        );
      }
      if (
        !/export async function register\(\): Promise<void>/.test(
          instrumentationSource
        )
      ) {
        throw new Error(
          `apps/${appName}/instrumentation.ts must export async function register(): Promise<void>.`
        );
      }
    }

    const routeFiles = await collectRouteFiles(appDir);
    for (const routeFile of routeFiles) {
      const relativeRoute = toPosixRelative(routeFile);
      if (relativeRoute.includes("csp-report/")) {
        continue;
      }
      if (/\/\[[^/]+\]\//u.test(relativeRoute)) {
        continue;
      }
      const testPath = routeFile.replace(/route\.ts$/u, "route.test.ts");
      try {
        await readFile(testPath, "utf8");
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          throw new Error(
            `${relativeRoute} must have a colocated route.test.ts (see docs/app-consistency-checklist.md).`
          );
        }
        throw error;
      }
    }
  }

  console.log("Zone modernization checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
