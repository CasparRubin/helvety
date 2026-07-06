import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const storeRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** Reads a Store app source file relative to the app root for wiring assertions. */
function readStoreSource(relativePath: string): string {
  return readFileSync(join(storeRoot, relativePath), "utf8");
}

describe("store product UI wiring", () => {
  it("does not define or render removed availability status UI", () => {
    const types = readStoreSource("lib/types/products.ts");
    expect(types).not.toContain("ProductStatus");
    expect(types).not.toMatch(/status\?:\s*ProductStatus/);

    const badge = readStoreSource("components/products/product-badge.tsx");
    expect(badge).not.toContain("StatusBadge");
    expect(badge).not.toMatch(/coming-soon|discontinued/);

    for (const component of [
      "components/products/product-card.tsx",
      "components/products/product-detail-hero.tsx",
    ]) {
      const src = readStoreSource(component);
      expect(src).not.toContain("StatusBadge");
      expect(src).not.toContain("ProductStatus");
    }

    const data = readStoreSource("lib/data/products.ts");
    expect(data).not.toMatch(/status:\s*"available"/);
  });

  it("product-badge module doc lists only active badge exports", () => {
    const badge = readStoreSource("components/products/product-badge.tsx");
    expect(badge).toContain("CategoryBadge");
    expect(badge).toContain("ArtistBadge");
    expect(badge).toContain("ReleaseDateBadge");
    expect(badge).not.toContain("StatusBadge");
    expect(badge).not.toContain("ProductBadge");
  });

  it("uses ecosystem category badges and filters (not legacy type pills)", () => {
    const card = readStoreSource("components/products/product-card.tsx");
    expect(card).toContain("CategoryBadge");
    expect(card).not.toContain("ProductBadge");

    const catalog = readStoreSource("components/products/products-catalog.tsx");
    expect(catalog).toContain("card.category");
    expect(catalog).toContain("getFilteredProducts({ category:");
    expect(catalog).not.toContain("card.type === filter");
    expect(catalog).not.toContain("type: filter");

    const filters = readStoreSource("components/products/product-filters.tsx");
    expect(filters).toContain("HELVETY_ECOSYSTEM_PRODUCT_SECTIONS");
    expect(filters).not.toContain("MonitorCloud");
    expect(filters).not.toContain('"saas"');
  });

  it("SSR catalog and detail heroes show ecosystem category labels", () => {
    const textCard = readStoreSource(
      "components/products/product-catalog-text-card.tsx"
    );
    expect(textCard).toContain("ecosystemCategoryTitle");
    expect(textCard).not.toMatch(/\{card\.type\}/);

    const serverHero = readStoreSource(
      "components/products/product-detail-server-hero.tsx"
    );
    expect(serverHero).toContain("ecosystemCategoryTitle");
    expect(serverHero).not.toMatch(/\{card\.type\}/);
  });
});
