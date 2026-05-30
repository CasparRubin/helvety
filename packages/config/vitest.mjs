import { createRequire } from "node:module";
import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(configDir, "../../node_modules");
const devDepsNodeModules = path.resolve(configDir, "../dev-deps/node_modules");
const devDepsRequire = createRequire(
  path.join(configDir, "../dev-deps/package.json")
);

const jestDomPkgDir = path.dirname(
  devDepsRequire.resolve("@testing-library/jest-dom/package.json")
);

const toolchainResolvePaths = {
  jestDomVitest: path.join(jestDomPkgDir, "dist/vitest.mjs"),
  jestDom: devDepsRequire.resolve("@testing-library/jest-dom"),
  testingLibraryReact: devDepsRequire.resolve("@testing-library/react"),
};

/** Stub CSS imports so layout tests do not load PostCSS/Tailwind (theme tests read CSS via fs). */
function vitestCssMockPlugin() {
  const prefix = "\0helvety-vitest-css:";
  return {
    name: "helvety-vitest-css-mock",
    enforce: "pre",
    resolveId(source) {
      if (source.endsWith(".css")) {
        return `${prefix}${source}`;
      }
    },
    load(id) {
      if (id.startsWith(prefix) || id.endsWith(".css")) {
        return "export default {}";
      }
    },
  };
}

/**
 * Creates the shared Helvety Vitest configuration.
 *
 * Vitest’s built-in `test.typecheck` stays disabled here; TypeScript is validated
 * by `turbo run type-check` (`tsc --noEmit`) instead.
 *
 * Testing-library and Vitest resolve from `@helvety/dev-deps/node_modules` (see resolve.alias).
 * Layout tests stub `.css` imports; Docs theme bridge tests read CSS via `fs`.
 *
 * @param {string} rootDir - The root directory of the app (e.g. `import.meta.dirname` in ESM or `__dirname` in CJS).
 * @param {{ passWithNoTests?: boolean }} [options] - Optional overrides; set `passWithNoTests: false` when the workspace has real tests.
 * @returns {import("vitest/config").UserConfig} The Vitest config.
 */
export function createVitestConfig(rootDir, options = {}) {
  const passWithNoTests = options.passWithNoTests ?? true;
  return defineConfig({
    css: false,
    plugins: [react(), vitestCssMockPlugin()],
    resolve: {
      alias: [
        {
          find: "@",
          replacement: path.resolve(rootDir, "."),
        },
        {
          find: "server-only",
          replacement: path.resolve(configDir, "vitest.server-only-mock.ts"),
        },
        {
          find: "@testing-library/jest-dom/vitest",
          replacement: toolchainResolvePaths.jestDomVitest,
        },
        {
          find: "@testing-library/jest-dom",
          replacement: toolchainResolvePaths.jestDom,
        },
        {
          find: "@testing-library/react",
          replacement: toolchainResolvePaths.testingLibraryReact,
        },
      ],
    },
    test: {
      environment: "jsdom",
      setupFiles: [path.resolve(rootDir, "vitest.setup.ts")],
      include: ["**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", ".next"],
      deps: {
        // Toolchain packages are pinned on @helvety/dev-deps; resolve aliases point at its node_modules.
        moduleDirectories: [
          "node_modules",
          rootNodeModules,
          devDepsNodeModules,
        ],
      },
      // Zone layouts import globals.css; skip PostCSS/Tailwind in unit tests (theme bridge tests read CSS via fs).
      css: false,
      // Command-bar and layout tests can exceed 5s under full turbo parallel runs.
      testTimeout: 10_000,
      // Default permissive; workspaces with coverage pass `passWithNoTests: false`.
      passWithNoTests,
      // TypeScript is checked by `turbo run type-check` (tsc --noEmit);
      // keep Vitest typecheck disabled to avoid duplicate type-check work.
      typecheck: {
        enabled: false,
      },
      coverage: {
        provider: "v8",
        include: [
          "app/**/*.{ts,tsx}",
          "components/**/*.{ts,tsx}",
          "hooks/**/*.{ts,tsx}",
          "lib/**/*.{ts,tsx}",
          "src/**/*.{ts,tsx}",
        ],
        exclude: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.spec.ts",
          "**/*.spec.tsx",
          "**/*.d.ts",
        ],
        reporter: ["text", "lcov"],
      },
    },
  });
}
