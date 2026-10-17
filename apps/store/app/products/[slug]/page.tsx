import { brandAssets } from "@helvety/brand/urls";
import { urls } from "@helvety/shared/config";
import {
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
  POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION,
} from "@helvety/shared/power-platform-configurator-copy";
import {
  findStoreProductCardBySlug,
  getStoreCatalogNewestFirst,
} from "@helvety/shared/store-catalog";
import { JsonLdScript } from "@helvety/ui/json-ld-script";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/lib/data/products";

import { ProductDetailClient } from "./product-detail-client";

import type { Metadata } from "next";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/** Prerender every catalog slug. */
export function generateStaticParams(): Array<{ slug: string }> {
  return getStoreCatalogNewestFirst().map((card) => ({ slug: card.slug }));
}

/**
 * Generate dynamic SEO metadata for each product page.
 * Uses {@link findStoreProductCardBySlug} only (no `products.ts` import on the server).
 */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = findStoreProductCardBySlug(slug);

  if (!card) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
      alternates: {
        canonical: `${urls.store}/products`,
      },
    };
  }

  const description =
    card.slug === "helvety-power-platform-configurator"
      ? POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION
      : card.shortDescription;

  return {
    title: card.name,
    description,
    alternates: {
      canonical: `${urls.store}/products/${card.slug}`,
    },
    openGraph: {
      title: `${card.name} | Helvety Store`,
      description,
      url: `${urls.store}/products/${card.slug}`,
      images: [
        {
          url: brandAssets.identifierLogo,
          alt: `${card.name} | Helvety Store`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${card.name} | Helvety Store`,
      description,
      images: [brandAssets.identifierLogo],
    },
  };
}

/**
 * Product detail page for viewing a specific product.
 * Resolves and validates params before rendering so unknown slugs return a
 * real 404 status instead of a streamed 200 shell.
 */
export default async function ProductDetailPage({
  params,
}: ProductPageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  if (!findStoreProductCardBySlug(slug)) {
    notFound();
  }
  return <ProductDetail params={params} />;
}

/** Resolved product body. Exported for server render tests. */
export async function ProductDetail({
  params,
}: ProductPageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const card = findStoreProductCardBySlug(slug);
  if (!card) {
    notFound();
  }

  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.name,
    description: card.shortDescription,
    url: `${urls.store}/products/${card.slug}`,
    brand: {
      "@type": "Organization",
      name: "Helvety",
    },
    ...(card.slug === "helvety-power-platform-configurator"
      ? { sameAs: [POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL] }
      : {}),
  };

  return (
    <>
      <JsonLdScript json={productJsonLd} />
      <ProductDetailClient product={product} />
    </>
  );
}
