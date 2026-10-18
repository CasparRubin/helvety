import { describe, expect, it } from "vitest";

import { getPackageInfo } from "./config";

describe("store package config", () => {
  it("exposes only canonical public download package ids", () => {
    const spo = getPackageInfo("spo-explorer");
    expect(spo).toBeDefined();
    expect(spo?.isPublic).toBe(true);
    expect(getPackageInfo("power-platform-configurator")).toBeUndefined();
    expect(getPackageInfo("power-automate-editor-preference")).toBeUndefined();
    expect(getPackageInfo("power-automate-force-v3-false")).toBeUndefined();
    expect(
      getPackageInfo("power-automate-editor-version-enforcer")
    ).toBeUndefined();
    expect(getPackageInfo("power-platform-tools")?.isPublic).toBe(true);
    expect(getPackageInfo("flow-explorer")).toBeUndefined();
    expect(getPackageInfo("web-resource-explorer")).toBeUndefined();
    expect(getPackageInfo("data-model-explorer")).toBeUndefined();
    expect(getPackageInfo("power-platform-tools")?.version).toBe("0.2.2");
    expect(getPackageInfo("power-platform-tools")?.downloadUrl).toContain(
      "/storage/v1/object/public/packages/power-platform-tools/"
    );
  });
});
