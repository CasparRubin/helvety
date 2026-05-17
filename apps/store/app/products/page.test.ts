import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("products page", () => {
  it("does not import catalog data on the server (client-only grid)", () => {
    const src = readFileSync(pagePath, "utf8");

    expect(src).toContain("<ProductsCatalog />");
    expect(src).not.toContain("getCachedAllProducts");
    expect(src).not.toContain("toCatalogProducts");
    expect(src).not.toContain("initialProducts");
  });
});
