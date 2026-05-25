import { urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
import { findStoreProductCardBySlug } from "@helvety/shared/store-catalog";
import { JsonLdScript } from "@helvety/ui/json-ld-script";
import { notFound } from "next/navigation";

import { ProductDetailClient } from "./product-detail-client";

import type { Metadata } from "next";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
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

  return {
    title: card.name,
    description: card.shortDescription,
    alternates: {
      canonical: `${urls.store}/products/${card.slug}`,
    },
    openGraph: {
      title: `${card.name} | Helvety Store`,
      description: card.shortDescription,
      url: `${urls.store}/products/${card.slug}`,
    },
    twitter: {
      card: "summary",
      title: `${card.name} | Helvety Store`,
      description: card.shortDescription,
    },
  };
}

/**
 * Product detail page for viewing a specific product.
 * Server passes only `slug`; full product rows load in {@link ProductDetailClient}.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const [{ slug }, nonce] = await Promise.all([params, getRequestCspNonce()]);

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
      <JsonLdScript nonce={nonce ?? undefined} json={productJsonLd} />
      <ProductDetailClient slug={slug} />
    </>
  );
}
