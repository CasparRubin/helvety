import { describe, expect, it } from "vitest";

import {
  catalogProductToCardProduct,
  productImageSrc,
  toCatalogProducts,
} from "./catalog-product";

import type { Product } from "@/lib/types/products";

describe("catalog-product", () => {
  it("serializes StaticImageData to a string src for RSC props", () => {
    const products: Product[] = [
      {
        id: "test",
        slug: "test",
        name: "Test",
        shortDescription: "Short",
        type: "software",
        status: "available",
        category: "utilities",
        description: { intro: "Intro" },
        features: [],
        pricing: { tiers: [], hasFreeTier: true, hasYearlyPricing: false },
        image: {
          src: "/store/_next/static/media/artwork.abc123.webp",
          width: 800,
          height: 600,
        },
      },
    ];

    const serialized = toCatalogProducts(products);
    expect(serialized[0]?.imageSrc).toBe(
      "/store/_next/static/media/artwork.abc123.webp"
    );
    expect(JSON.stringify(serialized)).not.toContain('"width"');
  });

  it("productImageSrc accepts plain string paths", () => {
    expect(productImageSrc("/foo.png")).toBe("/foo.png");
  });

  it("catalogProductToCardProduct maps slim rows for ProductCard", () => {
    const card = catalogProductToCardProduct({
      id: "helvety-pdf",
      slug: "helvety-pdf",
      name: "Helvety PDF",
      shortDescription: "PDF tool",
      type: "saas",
      status: "available",
      category: "utilities",
      imageSrc: "/artwork.webp",
      releaseDate: "2024-01-01",
    });

    expect(card.image).toBe("/artwork.webp");
    expect(card.metadata?.releaseDate).toBe("2024-01-01");
  });
});
