import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const configDir = path.dirname(fileURLToPath(import.meta.url));

describe("@helvety/config package exports", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(configDir, "package.json"), "utf8")
  );

  it("exports extension tsconfig and vitest factory entry points", () => {
    expect(packageJson.exports["./tsconfig.extension.json"]).toBe(
      "./tsconfig.extension.json"
    );
    expect(packageJson.exports["./vitest-extension"]).toEqual({
      types: "./vitest-extension.d.ts",
      default: "./vitest-extension.mjs",
    });
  });

  it("ships extension config files on disk", () => {
    expect(
      readFileSync(path.join(configDir, "tsconfig.extension.json"), "utf8")
    ).toContain('"extends"');
    expect(
      readFileSync(path.join(configDir, "vitest-extension.mjs"), "utf8")
    ).toContain("createExtensionVitestConfig");
    expect(
      readFileSync(path.join(configDir, "vitest-extension.d.ts"), "utf8")
    ).toContain("createExtensionVitestConfig");
  });
});
