import { describe, expect, it } from "vitest";

import {
  STORE_PRODUCT_CARDS,
  compareStoreCatalogEntriesNewestFirst,
  getStoreCatalogNewestFirst,
  requireStoreProductCard,
} from "./store-catalog";

describe("store-catalog", () => {
  it("lists eight products", () => {
    expect(STORE_PRODUCT_CARDS).toHaveLength(8);
  });

  it("sorts newest release first with expected endpoints", () => {
    const sorted = getStoreCatalogNewestFirst();
    expect(sorted[0]?.id).toBe("helvety-image-upscaler");
    expect(sorted[sorted.length - 1]?.id).toBe("helvety-pdf");
  });

  it("includes a non-empty runs-on label on every card", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.runsOn.trim().length).toBeGreaterThan(0);
    }
  });

  it("declares free and open-source flags on every current card", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.isFree).toBe(true);
      expect(card.isOpenSource).toBe(true);
    }
  });

  it("orders ties by PRODUCT_RELEASE_TIE_PRIORITY", () => {
    const a = { id: "helvety-pdf", releaseDate: "2025-09-14" };
    const b = { id: "helvety-spo-explorer", releaseDate: "2025-10-05" };
    expect(compareStoreCatalogEntriesNewestFirst(a, b)).toBeGreaterThan(0);
    expect(compareStoreCatalogEntriesNewestFirst(b, a)).toBeLessThan(0);
  });

  it("Power Automate card blurb matches extension Survey tab (not legacy Feedback copy)", () => {
    const card = requireStoreProductCard("helvety-power-automate-editor-preference");
    expect(card.name).toBe("Power Automate Editor Version Enforcer");
    const { shortDescription } = card;
    expect(shortDescription).toContain("Survey tab");
    expect(shortDescription).not.toContain("Feedback tab");
    expect(shortDescription).toContain("Hide");
    expect(shortDescription).toContain("Show");
    expect(shortDescription).not.toMatch(/ignore by default/i);
  });
});
