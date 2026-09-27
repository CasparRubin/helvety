import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../components/products/products-catalog.tsx"
);
const gridPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../components/products/product-grid.tsx"
);
const cardPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../components/products/product-card.tsx"
);

describe("products page", () => {
  it("server-renders artwork cards and preloads the first row", () => {
    const pageSrc = readFileSync(pagePath, "utf8");
    const catalogSrc = readFileSync(catalogPath, "utf8");
    const gridSrc = readFileSync(gridPath, "utf8");
    const cardSrc = readFileSync(cardPath, "utf8");

    expect(pageSrc).toContain("getCachedStoreCatalogCards");
    expect(pageSrc).toContain("catalogArtwork");
    expect(pageSrc).toContain("ProductsCatalog");
    expect(pageSrc).toContain("ProductGrid");
    expect(pageSrc).toContain("priorityCount={3}");
    expect(pageSrc).not.toContain("ssr: false");
    expect(pageSrc).not.toContain('import("@/lib/data/products")');
    expect(pageSrc).not.toMatch(
      /import\s*\{[^}]*getAllProducts[^}]*\}\s*from\s*["']@\/lib\/data\/products["']/
    );

    expect(catalogSrc).toContain("CatalogCardFrame");
    expect(catalogSrc).toContain("category !== filter");
    expect(catalogSrc).not.toContain("ProductCatalogTextCard");
    expect(catalogSrc).not.toContain('import("@/lib/data/products")');
    expect(catalogSrc).not.toMatch(
      /import\s*\{[^}]*getAllProducts[^}]*\}\s*from\s*["']@\/lib\/data\/products["']/
    );

    expect(gridSrc).toContain("preload={index < priorityCount}");
    expect(cardSrc).not.toContain("prefetch=");
  });
});
