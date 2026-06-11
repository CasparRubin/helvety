import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { urls } from "@helvety/shared/config";
import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
import { findStoreProductCardBySlug } from "@helvety/shared/store-catalog";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ProductDetailPage, { generateMetadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers([["x-nonce", "test-nonce"]])),
}));

vi.mock("./product-detail-client", () => ({
  ProductDetailClient: ({ slug }: { slug: string }) => (
    <div data-testid="product-detail-client">{slug}</div>
  ),
}));

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  })
);

vi.mock("next/navigation", () => ({
  notFound,
}));

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("store product SEO", () => {
  it("does not import products.ts on the server page module", () => {
    const src = readFileSync(pagePath, "utf8");
    expect(src).toContain("findStoreProductCardBySlug");
    expect(src).toContain("notFound");
    expect(src).not.toContain("@/lib/data/products");
    expect(src).not.toContain("product-catalog-cache");
    expect(src).toContain("ProductDetailServerHero");
  });

  it("calls notFound for unknown product slugs on the server", async () => {
    await expect(
      ProductDetailPage({
        params: Promise.resolve({ slug: "missing-product" }),
      })
    ).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("returns indexable canonical metadata for a valid product", async () => {
    const card = findStoreProductCardBySlug("helvety-links");
    if (!card) throw new Error("Expected Helvety Links product card");

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: card.slug }),
    });

    expect(metadata.alternates?.canonical).toBe(
      `${urls.store}/products/${card.slug}`
    );
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.url).toBe(`${urls.store}/products/${card.slug}`);
    expect(metadata.title).toBe(card.name);
    expect(metadata.description).toBe(card.shortDescription);
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
    const card = findStoreProductCardBySlug("helvety-pdf");
    if (!card) throw new Error("Expected Helvety PDF product card");

    const element = await ProductDetailPage({
      params: Promise.resolve({ slug: card.slug }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain(`"url":"${urls.store}/products/${card.slug}"`);
    expect(html).toContain(card.name);
  });

  it("renders Chrome Web Store sameAs in JSON-LD for Power Platform Configurator", async () => {
    const card = findStoreProductCardBySlug(
      "helvety-power-platform-configurator"
    );
    if (!card) {
      throw new Error("Expected Power Platform Configurator product card");
    }

    const element = await ProductDetailPage({
      params: Promise.resolve({ slug: card.slug }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('"sameAs"');
    expect(html).toContain(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL);
  });
});
