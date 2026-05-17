import { beforeEach, describe, expect, it, vi } from "vitest";

const productMocks = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
  getAllProducts: vi.fn(),
}));

vi.mock("./products", () => ({
  getProductBySlug: productMocks.getProductBySlug,
  getAllProducts: productMocks.getAllProducts,
}));

import {
  getCachedAllProducts,
  getCachedProductBySlug,
} from "./product-catalog-cache";

describe("product-catalog-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productMocks.getProductBySlug.mockImplementation((slug: string) => ({
      slug,
      id: slug,
    }));
    productMocks.getAllProducts.mockReturnValue([{ id: "a", slug: "a" }]);
  });

  it("delegates slug lookups to getProductBySlug", () => {
    const product = getCachedProductBySlug("helvety-links");

    expect(product).toEqual({ slug: "helvety-links", id: "helvety-links" });
    expect(productMocks.getProductBySlug).toHaveBeenCalledWith("helvety-links");
  });

  it("delegates list lookups to getAllProducts", () => {
    const products = getCachedAllProducts();

    expect(products).toEqual([{ id: "a", slug: "a" }]);
    expect(productMocks.getAllProducts).toHaveBeenCalledTimes(1);
  });

  it("looks up different slugs independently", () => {
    getCachedProductBySlug("helvety-links");
    getCachedProductBySlug("helvety-pdf");

    expect(productMocks.getProductBySlug).toHaveBeenCalledTimes(2);
    expect(productMocks.getProductBySlug).toHaveBeenNthCalledWith(
      1,
      "helvety-links"
    );
    expect(productMocks.getProductBySlug).toHaveBeenNthCalledWith(
      2,
      "helvety-pdf"
    );
  });
});
