import path from "path";
import { fileURLToPath } from "url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates the shared Helvety Vitest configuration.
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
      typecheck: {
        enabled: true,
      },
      coverage: {
        provider: "v8",
        include: ["lib/**/*.ts", "lib/**/*.tsx"],
        exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.d.ts"],
        reporter: ["text"],
      },
    },
  });
}
