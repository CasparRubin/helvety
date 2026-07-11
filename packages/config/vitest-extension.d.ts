import type { UserConfig } from "vitest/config";

export function createExtensionVitestConfig(
  rootDir: string,
  options?: {
    passWithNoTests?: boolean;
    environment?: "jsdom" | "node";
    setupVitestSetupFile?: boolean;
  }
): UserConfig;
