import { urls } from "@helvety/shared/config";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getAllProducts } from "@/lib/data/products";

import ProductDetailPage, { generateMetadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers([["x-nonce", "test-nonce"]])),
}));

vi.mock("./product-detail-client", () => ({
  ProductDetailClient: ({ slug }: { slug: string }) => (
    <div data-testid="product-detail-client">{slug}</div>
  ),
}));

/** Normalizes Next metadata image variants to a URL string for assertions. */
function getMetadataImageUrl(
  image: string | URL | { url?: string | URL } | undefined
): string | undefined {
  if (!image) {
    return undefined;
  }
  if (typeof image === "string") {
    return image;
  }
  if (image instanceof URL) {
    return image.toString();
  }
  const value = image.url;
  if (!value) {
    return undefined;
  }
  return typeof value === "string" ? value : value.toString();
}

describe("store product SEO", () => {
  it("returns indexable canonical metadata for a valid product", async () => {
    const product = getAllProducts()[0];
    if (!product) throw new Error("Expected seeded products");

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: product.slug }),
    });

    expect(metadata.alternates?.canonical).toBe(
      `${urls.store}/products/${product.slug}`
    );
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.url).toBe(
      `${urls.store}/products/${product.slug}`
    );
  });

  it("returns explicit noindex metadata for unknown products", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "missing-product" }),
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(metadata.alternates?.canonical).toBe(`${urls.store}/products`);
  });

  it("renders product JSON-LD for valid products", async () => {
    const product = getAllProducts()[0];
    if (!product) throw new Error("Expected seeded products");

    const element = await ProductDetailPage({
      params: Promise.resolve({ slug: product.slug }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain(`"url":"${urls.store}/products/${product.slug}"`);
    expect(html).toContain(product.slug);
  });

  it("uses a stable absolute image URL in metadata for products without screenshots", async () => {
    const productWithoutScreenshot = getAllProducts().find(
      (product) => !product.media?.screenshots?.length
    );
    if (!productWithoutScreenshot) {
      throw new Error("Expected at least one product without screenshots");
    }

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: productWithoutScreenshot.slug }),
    });

    const ogImages = metadata.openGraph?.images;
    const twitterImages = metadata.twitter?.images;
    const ogImage = Array.isArray(ogImages) ? ogImages[0] : ogImages;
    const twitterImage = Array.isArray(twitterImages)
      ? twitterImages[0]
      : twitterImages;

    const ogImageUrl = getMetadataImageUrl(ogImage);
    const twitterImageUrl = getMetadataImageUrl(twitterImage);

    expect(ogImageUrl).toBeTruthy();
    expect(twitterImageUrl).toBeTruthy();
    expect(ogImageUrl).toContain(urls.home);
    expect(twitterImageUrl).toContain(urls.home);
  });

  it("includes an image URL in JSON-LD for products without screenshots", async () => {
    const productWithoutScreenshot = getAllProducts().find(
      (product) => !product.media?.screenshots?.length
    );
    if (!productWithoutScreenshot) {
      throw new Error("Expected at least one product without screenshots");
    }

    const element = await ProductDetailPage({
      params: Promise.resolve({ slug: productWithoutScreenshot.slug }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('"image":"');
    expect(html).toContain(urls.home);
  });
});
