import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("products page", () => {
  it("server-renders the catalog from getCachedAllProducts", () => {
    const src = readFileSync(pagePath, "utf8");

    expect(src).toContain("getCachedAllProducts");
    expect(src).toContain("<ProductsCatalog initialProducts={products} />");
    expect(src).not.toContain("<ProductsCatalog />");
  });
});
