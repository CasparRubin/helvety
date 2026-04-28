import { describe, expect, it } from "vitest";

import { getAllProducts, getProductBySlug } from "./products";

describe("store product catalog", () => {
  it("includes all seven listings", () => {
    expect(getAllProducts()).toHaveLength(7);
  });

  it("default sort is newest release first (Image Upscaler last shipped)", () => {
    const ids = getAllProducts().map((p) => p.id);
    expect(ids[0]).toBe("helvety-image-upscaler");
    expect(ids[ids.length - 1]).toBe("helvety-pdf");
  });

  it("resolves known product slugs", () => {
    expect(
      getProductBySlug("helvety-power-automate-force-v3-false")?.name
    ).toBe("Power Automate Browser Extension");
    expect(getProductBySlug("helvety-spo-explorer")).toBeDefined();
    expect(getProductBySlug("helvety-pdf")).toBeDefined();
    expect(getProductBySlug("helvety-image-upscaler")).toBeDefined();
  });
});
