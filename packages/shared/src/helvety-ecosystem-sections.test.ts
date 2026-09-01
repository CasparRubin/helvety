import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { urls } from "./config";
import {
  allEcosystemStoreProductSlugs,
  ecosystemCategoryForStoreSlug,
  ecosystemCategoryTitle,
  ecosystemItemHref,
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS,
} from "./helvety-ecosystem-sections";
import { STORE_PRODUCT_CARDS } from "./store-catalog";

const ecosystemSourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "helvety-ecosystem-sections.ts"
);

describe("helvety-ecosystem-sections", () => {
  it("excludes non-zone url keys from HelvetyWebAppUrlKey", () => {
    const source = readFileSync(ecosystemSourcePath, "utf8");
    expect(source).toMatch(
      /Exclude<\s*keyof typeof urls,\s*[\s\S]*"storeProducts"/
    );

    for (const section of HELVETY_ECOSYSTEM_PRODUCT_SECTIONS) {
      for (const item of section.items) {
        if (!("webAppUrlKey" in item) || item.webAppUrlKey === undefined) {
          continue;
        }
        const webAppUrlKey = item.webAppUrlKey;
        expect(webAppUrlKey).not.toBe("store");
        expect(webAppUrlKey).not.toBe("storeProducts");
        expect(Object.hasOwn(urls, webAppUrlKey)).toBe(true);
      }
    }
  });

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
    const pdf = HELVETY_ECOSYSTEM_PRODUCT_SECTIONS[0].items[0];
    expect(pdf.storeProductSlug).toBe("helvety-pdf");
    expect(ecosystemItemHref(pdf)).toMatch(/\/pdf$/);

    const ppc = HELVETY_ECOSYSTEM_PRODUCT_SECTIONS[1].items[0];
    expect(ecosystemItemHref(ppc)).toMatch(
      /\/store\/products\/helvety-power-platform-configurator$/
    );
  });

  it("does not include removed products", () => {
    const slugs = allEcosystemStoreProductSlugs();
    expect(slugs).not.toContain("helvety-tasks");
    expect(slugs).not.toContain("helvety-browser-extension");
    expect(slugs).not.toContain("helvety-image-upscaler");
    expect(HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map((s) => s.slug)).toEqual([
      "file-tools",
      "browser-extensions",
      "sharepoint-apps",
      "desktop-apps",
    ]);
    expect(slugs).not.toContain("helvety-cloud");
  });
});
