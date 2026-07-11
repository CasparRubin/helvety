import path from "path";
import { fileURLToPath } from "url";

import { describe, expect, it } from "vitest";

import { createExtensionVitestConfig } from "./vitest-extension.mjs";

const configDir = path.dirname(fileURLToPath(import.meta.url));

describe("createExtensionVitestConfig", () => {
  it("uses extension include patterns and jsdom by default", () => {
    const config = createExtensionVitestConfig("/tmp/extension");

    expect(config.test?.include).toEqual([
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
    ]);
    expect(config.test?.environment).toBe("jsdom");
    expect(config.test?.globals).toBe(false);
    expect(config.test?.passWithNoTests).toBe(false);
  });

  it("allows node environment override for pure lib tests", () => {
    const config = createExtensionVitestConfig("/tmp/extension", {
      environment: "node",
    });

    expect(config.test?.environment).toBe("node");
  });

  it("configures shadcn CSS alias for @helvety/ui imports", () => {
    const config = createExtensionVitestConfig("/tmp/extension");
    const aliases = config.resolve?.alias ?? [];
    const shadcnAlias = Array.isArray(aliases)
      ? aliases.find((entry) => entry.find === "shadcn/tailwind.css")
      : undefined;

    expect(shadcnAlias?.replacement).toMatch(/tailwind\.css$/);
    expect(config.test?.setupFiles).toEqual([]);
  });

  it("uses local vitest.setup.ts when present", () => {
    const rootDir = path.resolve(configDir, "../../apps/pdf");
    const config = createExtensionVitestConfig(rootDir);

    expect(config.test?.setupFiles).toEqual([
      path.resolve(rootDir, "vitest.setup.ts"),
    ]);
  });

  it("skips local vitest.setup.ts when setupVitestSetupFile is false", () => {
    const rootDir = path.resolve(configDir, "../../apps/pdf");
    const config = createExtensionVitestConfig(rootDir, {
      setupVitestSetupFile: false,
    });

    expect(config.test?.setupFiles).toEqual([]);
  });

  it("excludes vendored .helvety tree and configures v8 coverage for src", () => {
    const config = createExtensionVitestConfig("/tmp/extension");

    expect(config.test?.exclude).toEqual(["node_modules", "dist", ".helvety"]);
    expect(config.test?.coverage?.provider).toBe("v8");
    expect(config.test?.coverage?.include).toEqual(["src/**/*.{ts,tsx}"]);
    expect(config.test?.coverage?.reporter).toEqual(["text", "lcov"]);
  });

  it("aliases jest-dom and testing-library for extension component tests", () => {
    const config = createExtensionVitestConfig("/tmp/extension");
    const aliases = config.resolve?.alias ?? [];
    const aliasFinds = Array.isArray(aliases)
      ? aliases.map((entry) => entry.find)
      : [];

    expect(aliasFinds).toContain("@testing-library/jest-dom/vitest");
    expect(aliasFinds).toContain("@testing-library/jest-dom/matchers");
    expect(aliasFinds).toContain("@testing-library/react");
  });
});
