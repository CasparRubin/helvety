import { requireStoreProductCard } from "@helvety/shared/store-catalog";
import { describe, expect, it } from "vitest";

import { getPackageInfo, isPublicPackage } from "./config";

describe("store package config", () => {
  it("exposes only canonical public download package ids", () => {
    expect(getPackageInfo("spo-explorer")).toBeDefined();
    expect(getPackageInfo("power-platform-configurator")).toBeDefined();
    expect(getPackageInfo("power-automate-editor-preference")).toBeUndefined();
    expect(getPackageInfo("power-automate-force-v3-false")).toBeUndefined();
    expect(
      getPackageInfo("power-automate-editor-version-enforcer")
    ).toBeUndefined();
  });

  it("links Power Platform Configurator package to the store catalog card", () => {
    const info = getPackageInfo("power-platform-configurator");
    expect(info).toBeDefined();
    if (!info) {
      return;
    }
    const card = requireStoreProductCard("helvety-power-platform-configurator");
    expect(info.productId).toBe(card.id);
    expect(info.productName).toBe(card.name);
    expect(info.filename).toBe("power-platform-configurator.zip");
    expect(info.storageFolderPath).toBe(
      "browserExtensions/power-platform-configurator"
    );
    expect(isPublicPackage("power-platform-configurator")).toBe(true);
  });

  it("keeps fallback version aligned with the shipped extension manifest", () => {
    const info = getPackageInfo("power-platform-configurator");
    expect(info?.version).toBe("2.8.5");
  });
});
