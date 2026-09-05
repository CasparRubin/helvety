import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(configDir, "../../node_modules");
const rootRequire = createRequire(path.join(configDir, "../../package.json"));
const devDepsRequire = createRequire(
  path.join(configDir, "../dev-deps/package.json")
);

const jestDomPkgDir = path.dirname(
  devDepsRequire.resolve("@testing-library/jest-dom/package.json")
);

const toolchainResolvePaths = {
  jestDomVitest: path.join(jestDomPkgDir, "dist/vitest.mjs"),
  jestDomMatchers: devDepsRequire.resolve("@testing-library/jest-dom/matchers"),
  jestDom: devDepsRequire.resolve("@testing-library/jest-dom"),
  testingLibraryReact: devDepsRequire.resolve("@testing-library/react"),
  react: rootRequire.resolve("react"),
  reactDom: rootRequire.resolve("react-dom"),
  reactDomServer: rootRequire.resolve("react-dom/server"),
  reactDomClient: rootRequire.resolve("react-dom/client"),
  reactJsxRuntime: rootRequire.resolve("react/jsx-runtime"),
  reactJsxDevRuntime: rootRequire.resolve("react/jsx-dev-runtime"),
  lucideReact: path.join(
    path.dirname(rootRequire.resolve("lucide-react/package.json")),
    "dist/esm/lucide-react.mjs"
  ),
  lucideReactDir: path.dirname(
    rootRequire.resolve("lucide-react/package.json")
  ),
  reactRemoveScroll: rootRequire.resolve("react-remove-scroll"),
  reactRemoveScrollDir: path.dirname(
    rootRequire.resolve("react-remove-scroll/package.json")
  ),
};

/** Optional aliases so Vitest still loads after Motion is removed from the tree. */
function framerMotionAliases(rootRequireFn) {
  try {
    const framerMotion = rootRequireFn.resolve("framer-motion");
    const framerMotionDir = path.dirname(
      rootRequireFn.resolve("framer-motion/package.json")
    );
    return [
      {
        find: /^framer-motion$/,
        replacement: framerMotion,
      },
      {
        find: /^framer-motion\/(.+)$/,
        replacement: `${framerMotionDir}/$1`,
      },
    ];
  } catch {
    return [];
  }
}

/** Vite alias that pins a package to the hoisted root ESM entry when available. */
function exactPackageAlias(rootRequireFn, packageName) {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let replacement;
  try {
    const pkgJsonPath = rootRequireFn.resolve(`${packageName}/package.json`);
    const pkgDir = path.dirname(pkgJsonPath);
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    const exportImport = pkg.exports?.["."]?.import?.default;
    if (typeof exportImport === "string") {
      replacement = path.join(pkgDir, exportImport);
    } else if (typeof pkg.module === "string") {
      replacement = path.join(pkgDir, pkg.module);
    } else {
      replacement = rootRequireFn.resolve(packageName);
    }
  } catch {
    replacement = rootRequireFn.resolve(packageName);
  }
  return {
    find: new RegExp(`^${escaped}$`),
    replacement,
  };
}

const hoistedTestPackages = [
  "@dnd-kit/accessibility",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "next/link",
  "next/navigation",
  "react-remove-scroll",
];

const hoistedPackageAliases = hoistedTestPackages.map((packageName) =>
  exactPackageAlias(rootRequire, packageName)
);

/** Force a single React/ReactDOM instance when Bun nests peer copies under node_modules/.bun. */
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
 * Testing-library and jest-dom resolve via `@helvety/dev-deps` (see `toolchainResolvePaths`
 * and Vitest resolve aliases/dedupe). Layout tests stub `.css` imports.
 *
 * @param {string} rootDir - The root directory of the app (e.g. `import.meta.dirname` in ESM or `__dirname` in CJS).
 * @param {{ passWithNoTests?: boolean }} [options] - Optional overrides; set `passWithNoTests: false` when the workspace has real tests.
 * @returns {import("vitest/config").UserConfig} The Vitest config.
 */
export function createVitestConfig(rootDir, options = {}) {
  const passWithNoTests = options.passWithNoTests ?? true;
  return defineConfig({
    css: false,
    plugins: [
      forceSingleReactPlugin(toolchainResolvePaths),
      react(),
      vitestCssMockPlugin(),
    ],
    resolve: {
      dedupe: ["react", "react-dom", "vitest"],
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
          find: "@helvety/shared/fonts",
          replacement: path.resolve(configDir, "vitest.fonts-mock.ts"),
        },
        {
          find: "@testing-library/jest-dom/vitest",
          replacement: toolchainResolvePaths.jestDomVitest,
        },
        {
          find: "@testing-library/jest-dom/matchers",
          replacement: toolchainResolvePaths.jestDomMatchers,
        },
        {
          find: "@testing-library/jest-dom",
          replacement: toolchainResolvePaths.jestDom,
        },
        {
          find: "@testing-library/react",
          replacement: toolchainResolvePaths.testingLibraryReact,
        },
        {
          find: /^react$/,
          replacement: toolchainResolvePaths.react,
        },
        {
          find: /^react-dom$/,
          replacement: toolchainResolvePaths.reactDom,
        },
        {
          find: /^react-dom\/server$/,
          replacement: toolchainResolvePaths.reactDomServer,
        },
        {
          find: /^react-dom\/client$/,
          replacement: toolchainResolvePaths.reactDomClient,
        },
        {
          find: /^react\/jsx-runtime$/,
          replacement: toolchainResolvePaths.reactJsxRuntime,
        },
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: toolchainResolvePaths.reactJsxDevRuntime,
        },
        {
          find: /^lucide-react$/,
          replacement: toolchainResolvePaths.lucideReact,
        },
        {
          find: /^lucide-react\/(.+)$/,
          replacement: `${toolchainResolvePaths.lucideReactDir}/$1`,
        },
        ...framerMotionAliases(rootRequire),
        ...hoistedPackageAliases,
        {
          find: /^react-remove-scroll\/(.+)$/,
          replacement: `${toolchainResolvePaths.reactRemoveScrollDir}/$1`,
        },
      ],
    },
    test: {
      environment: "jsdom",
      setupFiles: [path.resolve(rootDir, "vitest.setup.ts")],
      include: ["**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", ".next"],
      server: {
        deps: {
          // Bun nests peers under node_modules/.bun; inline so Vite aliases dedupe React.
          inline: true,
        },
      },
      deps: {
        // Bun nests peer deps under node_modules/.bun; dedupe + aliases keep one React/Vitest instance.
        moduleDirectories: ["node_modules", rootNodeModules],
      },
      // Zone layouts import globals.css; skip PostCSS/Tailwind in unit tests (theme bridge tests read CSS via fs).
      css: false,
      // Command-bar, layout, and env-module tests (dynamic import after
      // vi.resetModules) can exceed 10s under full turbo parallel runs.
      testTimeout: 20_000,
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
