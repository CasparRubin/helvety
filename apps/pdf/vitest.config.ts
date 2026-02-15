import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "vitest.server-only-mock.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
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
