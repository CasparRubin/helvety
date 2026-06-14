import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const storeRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 *
 */
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
    expect(badge).toContain("ProductBadge");
    expect(badge).toContain("ArtistBadge");
    expect(badge).toContain("ReleaseDateBadge");
    expect(badge).not.toContain("StatusBadge");
  });
});
