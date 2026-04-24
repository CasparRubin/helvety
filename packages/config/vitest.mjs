import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates the shared Helvety Vitest configuration.
 *
 * Vitest’s built-in `test.typecheck` stays disabled here; TypeScript is validated
 * by `turbo run type-check` (`tsc --noEmit`) instead.
 *
 * @param {string} rootDir - The root directory of the app (e.g. `import.meta.dirname` in ESM or `__dirname` in CJS).
 * @returns {import("vitest/config").UserConfig} The Vitest config.
 */
export function createVitestConfig(rootDir) {
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "."),
        "server-only": path.resolve(configDir, "vitest.server-only-mock.ts"),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: [path.resolve(rootDir, "vitest.setup.ts")],
      include: ["**/*.test.{ts,tsx}"],
      exclude: ["node_modules", ".next"],
      passWithNoTests: true,
      // TypeScript is checked by `turbo run type-check` (tsc --noEmit); Vitest's
      // built-in typecheck duplicates work and adds noisy experimental logs.
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
        exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.d.ts"],
        reporter: ["text"],
      },
    },
  });
}
