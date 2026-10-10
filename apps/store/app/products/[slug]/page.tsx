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
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailClient } from "./product-detail-client";

import type { Metadata } from "next";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/** Prerender every catalog slug. Unknown slugs still resolve at request time. */
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
    },
    twitter: {
      card: "summary",
      title: `${card.name} | Helvety Store`,
      description,
    },
  };
}

/**
 * Product detail page for viewing a specific product.
 * Params stay inside Suspense so Partial Prefetching can serve a shell for
 * slugs that were not prerendered.
 */
export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

/** Resolved product body. Exported for server render tests. */
export async function ProductDetail({ params }: ProductPageProps) {
  const { slug } = await params;
  const card = findStoreProductCardBySlug(slug);
  if (!card) {
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
      <ProductDetailClient slug={slug} />
    </>
  );
}
