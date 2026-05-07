import path from "path";

import { describe, expect, it } from "vitest";

import { createVitestConfig } from "./vitest.mjs";

describe("createVitestConfig", () => {
  it("uses shared include patterns and coverage reporters", () => {
    const config = createVitestConfig("/tmp/workspace");
    const include = config.test?.include ?? [];
    const reporters = config.test?.coverage?.reporter ?? [];

    expect(include).toEqual(["**/*.{test,spec}.{ts,tsx}"]);
    expect(reporters).toEqual(["text", "lcov"]);
    expect(config.test?.passWithNoTests).toBe(true);
  });

  it("configures alias and setup path from workspace root", () => {
    const rootDir = "/tmp/app";
    const config = createVitestConfig(rootDir);
    const expectedRoot = path.resolve(rootDir, ".");
    const expectedSetupFile = path.resolve(rootDir, "vitest.setup.ts");

    expect(config.resolve?.alias?.["@"]).toBe(expectedRoot);
    expect(config.test?.setupFiles).toEqual([expectedSetupFile]);
  });
});
