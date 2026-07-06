import { describe, expect, it } from "vitest";

import {
  allEcosystemStoreProductSlugs,
  ecosystemCategoryForStoreSlug,
  ecosystemCategoryTitle,
  ecosystemItemHref,
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS,
} from "./helvety-ecosystem-sections";
import { STORE_PRODUCT_CARDS } from "./store-catalog";

describe("helvety-ecosystem-sections", () => {
  it("derives a display title for every category slug", () => {
    for (const section of HELVETY_ECOSYSTEM_PRODUCT_SECTIONS) {
      expect(ecosystemCategoryTitle(section.slug)).toBe(section.title);
    }
  });

  it("maps every store catalog slug to exactly one ecosystem category", () => {
    const registrySlugs = new Set(allEcosystemStoreProductSlugs());
    const catalogSlugs = STORE_PRODUCT_CARDS.map((card) => card.slug);

    expect(registrySlugs.size).toBe(catalogSlugs.length);
    for (const slug of catalogSlugs) {
      expect(registrySlugs.has(slug)).toBe(true);
      expect(ecosystemCategoryForStoreSlug(slug)).toBeTruthy();
    }
  });

  it("has no orphan registry entries without a store catalog card", () => {
    const catalogSlugs = new Set(STORE_PRODUCT_CARDS.map((card) => card.slug));
    for (const slug of allEcosystemStoreProductSlugs()) {
      expect(catalogSlugs.has(slug)).toBe(true);
    }
  });

  it("derives store card categories from the ecosystem registry", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.category).toBe(ecosystemCategoryForStoreSlug(card.slug));
    }
  });

  it("resolves web-zone hrefs for monorepo apps and store hrefs for extensions", () => {
    const tasks = HELVETY_ECOSYSTEM_PRODUCT_SECTIONS[0].items[0];
    expect(tasks.storeProductSlug).toBe("helvety-tasks");
    expect(ecosystemItemHref(tasks)).toMatch(/\/tasks$/);

    const browserExtension = HELVETY_ECOSYSTEM_PRODUCT_SECTIONS[2].items[0];
    expect(ecosystemItemHref(browserExtension)).toMatch(
      /\/store\/products\/helvety-browser-extension$/
    );
  });

  it("assigns the expected ecosystem category to every catalog product", () => {
    const expectedBySlug: Record<string, string> = {
      "helvety-tasks": "encryption-apps",
      "helvety-contacts": "encryption-apps",
      "helvety-notes": "encryption-apps",
      "helvety-links": "encryption-apps",
      "helvety-pdf": "file-tools",
      "helvety-image-upscaler": "file-tools",
      "helvety-image-editor": "file-tools",
      "helvety-browser-extension": "browser-extensions",
      "helvety-power-platform-configurator": "browser-extensions",
      "helvety-spo-explorer": "sharepoint-apps",
      "helvety-screen-tools": "desktop-apps",
    };

    expect(Object.keys(expectedBySlug)).toHaveLength(
      STORE_PRODUCT_CARDS.length
    );

    for (const card of STORE_PRODUCT_CARDS) {
      expect(card.category).toBe(expectedBySlug[card.slug]);
    }
  });

  it("groups catalog products into the five ecosystem sections", () => {
    const counts = Object.fromEntries(
      HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map((section) => [
        section.slug,
        STORE_PRODUCT_CARDS.filter((card) => card.category === section.slug)
          .length,
      ])
    );

    expect(counts).toEqual({
      "encryption-apps": 4,
      "file-tools": 3,
      "browser-extensions": 2,
      "sharepoint-apps": 1,
      "desktop-apps": 1,
    });
  });
});
