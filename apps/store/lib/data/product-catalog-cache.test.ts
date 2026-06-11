import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheModulePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "product-catalog-cache.ts"
);

const mocks = vi.hoisted(() => ({
  unstable_cache: vi.fn((fn: () => unknown) => fn),
  getStoreCatalogNewestFirst: vi.fn(),
  getAllProducts: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: mocks.unstable_cache,
}));

vi.mock("@helvety/shared/store-catalog", () => ({
  getStoreCatalogNewestFirst: mocks.getStoreCatalogNewestFirst,
}));

vi.mock("./products", () => ({
  getAllProducts: mocks.getAllProducts,
}));

import {
  getCachedAllProducts,
  getCachedStoreCatalogCards,
} from "./product-catalog-cache";

describe("product-catalog-cache", () => {
  it("registers cross-request cache with the store-catalog tag", () => {
    const src = readFileSync(cacheModulePath, "utf8");

    expect(src).toContain("unstable_cache");
    expect(src).toContain('"store-catalog"');
    expect(src).toContain("revalidate:");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStoreCatalogNewestFirst.mockReturnValue([
      { id: "helvety-pdf", slug: "helvety-pdf" },
    ]);
    mocks.getAllProducts.mockReturnValue([{ id: "a", slug: "a" }]);
  });

  it("returns store catalog cards from shared store-catalog", async () => {
    const cards = await getCachedStoreCatalogCards();

    expect(cards).toEqual([{ id: "helvety-pdf", slug: "helvety-pdf" }]);
    expect(mocks.getStoreCatalogNewestFirst).toHaveBeenCalledTimes(1);
  });

  it("delegates full product lookups to getAllProducts per request", () => {
    const products = getCachedAllProducts();

    expect(products).toEqual([{ id: "a", slug: "a" }]);
    expect(mocks.getAllProducts).toHaveBeenCalledTimes(1);
  });
});
