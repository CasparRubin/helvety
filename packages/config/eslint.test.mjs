import { describe, expect, it } from "vitest";

import {
  createEslintConfig,
  createPackageEslintConfig,
  default as defaultConfig,
} from "./eslint.mjs";

describe("eslint shared config factories", () => {
  it("creates app config with import boundaries and test naming override", () => {
    const config = createEslintConfig("/tmp/app");
    const boundaryConfig = config.find((entry) => {
      const restrictionRule = entry?.rules?.["no-restricted-imports"];
      if (!Array.isArray(restrictionRule)) return false;
      const restrictionOptions = restrictionRule[1];
      return (
        typeof restrictionOptions === "object" &&
        restrictionOptions !== null &&
        Array.isArray(restrictionOptions.patterns)
      );
    });
    const testOverride = config.find(
      (entry) =>
        Array.isArray(entry.files) && entry.files.includes("**/*.test.ts")
    );
    const boundaryPatterns =
      boundaryConfig?.rules?.["no-restricted-imports"]?.[1]?.patterns ?? [];

    expect(boundaryPatterns.length).toBeGreaterThan(0);
    expect(boundaryPatterns[0]?.message ?? "").toContain(
      "Do not import code directly from other apps"
    );
    expect(testOverride?.rules?.["@typescript-eslint/naming-convention"]).toBe(
      "off"
    );
  });

  it("creates package config and exposes default self-lint config", () => {
    const packageConfig = createPackageEslintConfig("/tmp/pkg");
    const packageTsConfig = packageConfig.find(
      (entry) => Array.isArray(entry.files) && entry.files.includes("**/*.ts")
    );
    const packageIgnores = packageConfig.find((entry) =>
      Array.isArray(entry.ignores)
    );
    const defaultIgnores = defaultConfig.find((entry) =>
      Array.isArray(entry.ignores)
    );

    expect(packageTsConfig).toBeTruthy();
    expect(packageIgnores?.ignores).toContain("node_modules/**");
    expect(defaultIgnores?.ignores).toContain("node_modules/**");
  });
});
