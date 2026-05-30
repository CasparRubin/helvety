import path from "path";

import { describe, expect, it } from "vitest";

import { createVitestConfig } from "./vitest.mjs";

describe("createVitestConfig", () => {
  it("uses shared include patterns and coverage reporters", () => {
    const config = createVitestConfig("/tmp/workspace");
    const strictConfig = createVitestConfig("/tmp/workspace", {
      passWithNoTests: false,
    });
    const include = config.test?.include ?? [];
    const reporters = config.test?.coverage?.reporter ?? [];

    expect(include).toEqual(["**/*.{test,spec}.{ts,tsx}"]);
    expect(reporters).toEqual(["text", "lcov"]);
    expect(config.test?.passWithNoTests).toBe(true);
    expect(strictConfig.test?.passWithNoTests).toBe(false);
  });

  it("configures alias and setup path from workspace root", () => {
    const rootDir = "/tmp/app";
    const config = createVitestConfig(rootDir);
    const expectedRoot = path.resolve(rootDir, ".");
    const expectedSetupFile = path.resolve(rootDir, "vitest.setup.ts");
    const aliases = config.resolve?.alias ?? [];
    const atAlias = Array.isArray(aliases)
      ? aliases.find((entry) => entry.find === "@")
      : aliases["@"];

    expect(atAlias?.replacement ?? atAlias).toBe(expectedRoot);
    expect(config.test?.setupFiles).toEqual([expectedSetupFile]);
    expect(config.test?.css).toBe(false);
  });
});
