import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../components/products/products-catalog.tsx"
);

describe("products page", () => {
  it("server-renders catalog cards and dynamic-imports artwork after mount", () => {
    const pageSrc = readFileSync(pagePath, "utf8");
    const catalogSrc = readFileSync(catalogPath, "utf8");

    expect(pageSrc).toContain("getCachedStoreCatalogCards");
    expect(pageSrc).toContain("ProductsCatalog");
    expect(pageSrc).toContain("initialCards");
    expect(pageSrc).not.toContain("ssr: false");
    expect(catalogSrc).toContain("initialCards");
    expect(catalogSrc).toContain("ProductCatalogTextCard");
    expect(catalogSrc).toContain('import("@/lib/data/products")');
    expect(catalogSrc).not.toMatch(
      /import\s*\{[^}]*getAllProducts[^}]*\}\s*from\s*["']@\/lib\/data\/products["']/
    );
  });
});
