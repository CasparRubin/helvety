import { beforeEach, describe, expect, it, vi } from "vitest";

const productMocks = vi.hoisted(() => ({
  getAllProducts: vi.fn(),
}));

vi.mock("./products", () => ({
  getAllProducts: productMocks.getAllProducts,
}));

import { getCachedAllProducts } from "./product-catalog-cache";

describe("product-catalog-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productMocks.getAllProducts.mockReturnValue([{ id: "a", slug: "a" }]);
  });

  it("delegates list lookups to getAllProducts", () => {
    const products = getCachedAllProducts();

    expect(products).toEqual([{ id: "a", slug: "a" }]);
    expect(productMocks.getAllProducts).toHaveBeenCalledTimes(1);
  });
});
