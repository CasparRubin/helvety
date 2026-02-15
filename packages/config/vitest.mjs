import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Creates the shared Helvety Vitest configuration.
 *
 * @param {string} rootDir - The root directory of the app (use `__dirname`).
 * @returns {import("vitest/config").UserConfig} The Vitest config.
 */
export function createVitestConfig(rootDir) {
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "."),
        "server-only": path.resolve(rootDir, "vitest.server-only-mock.ts"),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: [path.resolve(rootDir, "vitest.setup.ts")],
      include: ["**/*.test.{ts,tsx}"],
      exclude: ["node_modules", ".next"],
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
