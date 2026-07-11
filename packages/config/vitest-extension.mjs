import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const devDepsRequire = createRequire(
  path.join(configDir, "../dev-deps/package.json")
);

/** @param {NodeRequire} primary @param {string} specifier */
function resolvePackage(primary, specifier) {
  try {
    return primary.resolve(specifier);
  } catch {
    return devDepsRequire.resolve(specifier);
  }
}

/** Stub CSS imports so component tests do not load PostCSS/Tailwind. */
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

/** Force a single React/ReactDOM instance when package managers nest peer copies. */
function forceSingleReactPlugin(paths) {
  const forcedIds = new Map([
    ["react", paths.react],
    ["react-dom", paths.reactDom],
    ["react/jsx-runtime", paths.reactJsxRuntime],
    ["react/jsx-dev-runtime", paths.reactJsxDevRuntime],
    ["react-dom/client", paths.reactDomClient],
    ["react-dom/server", paths.reactDomServer],
  ]);

  return {
    name: "helvety-vitest-force-single-react",
    enforce: "pre",
    resolveId(source, importer) {
      const forced = forcedIds.get(source);
      if (forced) {
        return forced;
      }
      if (
        importer &&
        (source === "react" ||
          source === "react-dom" ||
          source.startsWith("react/") ||
          source.startsWith("react-dom/"))
      ) {
        const nested = forcedIds.get(source);
        if (nested) {
          return nested;
        }
      }
    },
  };
}

/**
 * Resolve toolchain paths from the consumer workspace (Chromium extension repo).
 *
 * @param {string} rootDir
 */
function resolveConsumerToolchainPaths(rootDir) {
  const consumerRequire = createRequire(path.join(rootDir, "package.json"));
  const jestDomPkgDir = path.dirname(
    resolvePackage(consumerRequire, "@testing-library/jest-dom/package.json")
  );

  return {
    jestDomVitest: path.join(jestDomPkgDir, "dist/vitest.mjs"),
    jestDomMatchers: resolvePackage(
      consumerRequire,
      "@testing-library/jest-dom/matchers"
    ),
    jestDom: resolvePackage(consumerRequire, "@testing-library/jest-dom"),
    testingLibraryReact: resolvePackage(
      consumerRequire,
      "@testing-library/react"
    ),
    react: resolvePackage(consumerRequire, "react"),
    reactDom: resolvePackage(consumerRequire, "react-dom"),
    reactDomServer: resolvePackage(consumerRequire, "react-dom/server"),
    reactDomClient: resolvePackage(consumerRequire, "react-dom/client"),
    reactJsxRuntime: resolvePackage(consumerRequire, "react/jsx-runtime"),
    reactJsxDevRuntime: resolvePackage(
      consumerRequire,
      "react/jsx-dev-runtime"
    ),
    lucideReact: path.join(
      path.dirname(
        resolvePackage(consumerRequire, "lucide-react/package.json")
      ),
      "dist/esm/lucide-react.mjs"
    ),
    lucideReactDir: path.dirname(
      resolvePackage(consumerRequire, "lucide-react/package.json")
    ),
    shadcnTailwindCss: resolvePackage(consumerRequire, "shadcn/tailwind.css"),
  };
}

/**
 * Vitest factory for Helvety Chromium extension repos (Vite + React, no Next.js).
 *
 * @param {string} rootDir - Extension repo root (`import.meta.dirname` in vitest.config.ts).
 * @param {{
 *   passWithNoTests?: boolean;
 *   environment?: "jsdom" | "node";
 *   setupVitestSetupFile?: boolean;
 * }} [options]
 * @returns {import("vitest/config").UserConfig}
 */
export function createExtensionVitestConfig(rootDir, options = {}) {
  const passWithNoTests = options.passWithNoTests ?? false;
  const environment = options.environment ?? "jsdom";
  const setupVitestSetupFile = options.setupVitestSetupFile ?? true;
  const paths = resolveConsumerToolchainPaths(rootDir);
  const setupFiles = [];

  if (setupVitestSetupFile) {
    const localSetup = path.resolve(rootDir, "vitest.setup.ts");
    if (existsSync(localSetup)) {
      setupFiles.push(localSetup);
    }
  }

  return defineConfig({
    css: false,
    plugins: [forceSingleReactPlugin(paths), react(), vitestCssMockPlugin()],
    resolve: {
      dedupe: ["react", "react-dom", "vitest"],
      alias: [
        {
          find: "shadcn/tailwind.css",
          replacement: paths.shadcnTailwindCss,
        },
        {
          find: "@testing-library/jest-dom/vitest",
          replacement: paths.jestDomVitest,
        },
        {
          find: "@testing-library/jest-dom/matchers",
          replacement: paths.jestDomMatchers,
        },
        {
          find: "@testing-library/jest-dom",
          replacement: paths.jestDom,
        },
        {
          find: "@testing-library/react",
          replacement: paths.testingLibraryReact,
        },
        {
          find: /^react$/,
          replacement: paths.react,
        },
        {
          find: /^react-dom$/,
          replacement: paths.reactDom,
        },
        {
          find: /^react-dom\/server$/,
          replacement: paths.reactDomServer,
        },
        {
          find: /^react-dom\/client$/,
          replacement: paths.reactDomClient,
        },
        {
          find: /^react\/jsx-runtime$/,
          replacement: paths.reactJsxRuntime,
        },
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: paths.reactJsxDevRuntime,
        },
        {
          find: /^lucide-react$/,
          replacement: paths.lucideReact,
        },
        {
          find: /^lucide-react\/(.+)$/,
          replacement: `${paths.lucideReactDir}/$1`,
        },
      ],
    },
    test: {
      environment,
      globals: false,
      setupFiles,
      include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
      exclude: ["node_modules", "dist", ".helvety"],
      testTimeout: 20_000,
      passWithNoTests,
      typecheck: {
        enabled: false,
      },
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.d.ts",
          "src/background.ts",
        ],
        reporter: ["text", "lcov"],
      },
    },
  });
}
