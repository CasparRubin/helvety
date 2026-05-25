import { describe, expect, it } from "vitest";

import { getPackageInfo, isPublicPackage } from "./config";

describe("store package config", () => {
  it("exposes only canonical public download package ids", () => {
    expect(getPackageInfo("spo-explorer")).toBeDefined();
    expect(getPackageInfo("power-platform-configurator")).toBeUndefined();
    expect(getPackageInfo("power-automate-editor-preference")).toBeUndefined();
    expect(getPackageInfo("power-automate-force-v3-false")).toBeUndefined();
    expect(
      getPackageInfo("power-automate-editor-version-enforcer")
    ).toBeUndefined();
  });

  it("does not serve Power Platform Configurator as a public zip package", () => {
    expect(isPublicPackage("power-platform-configurator")).toBe(false);
  });

  it("only spo-explorer is publicly downloadable from package config", () => {
    expect(isPublicPackage("spo-explorer")).toBe(true);
    for (const packageId of [
      "power-platform-configurator",
      "power-automate-editor-preference",
      "unknown-package",
    ] as const) {
      expect(isPublicPackage(packageId)).toBe(false);
    }
  });
});
