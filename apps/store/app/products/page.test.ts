import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const clientPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../components/products/products-catalog-client.tsx"
);

describe("products page", () => {
  it("loads the catalog client-only without server products.ts import", () => {
    const pageSrc = readFileSync(pagePath, "utf8");
    const clientSrc = readFileSync(clientPath, "utf8");

    expect(pageSrc).toContain("ProductsCatalogClient");
    expect(pageSrc).not.toContain("getCachedAllProducts");
    expect(pageSrc).not.toContain("@/lib/data/products");
    expect(clientSrc).toContain("ssr: false");
    expect(clientSrc).toContain("dynamic(");
  });
});
