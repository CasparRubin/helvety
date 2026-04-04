import { urls } from "@helvety/shared/config";
import { headers } from "next/headers";

import { getProductBySlug } from "@/lib/data/products";

import { ProductDetailClient } from "./product-detail-client";

import type { Metadata } from "next";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic SEO metadata for each product page.
 * Falls back to a generic title when the product slug is not found.
 */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const screenshot = product.media?.screenshots?.[0];
  const ogImageUrl =
    screenshot?.src ??
    (product.image?.startsWith("/")
      ? `${urls.home}${product.image}`
      : undefined);
  const ogImageAlt = screenshot?.alt ?? product.name;

  return {
    title: product.name,
    description: product.shortDescription,
    keywords: product.metadata?.keywords,
    alternates: {
      canonical: `${urls.store}/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Helvety Store`,
      description: product.shortDescription,
      url: `${urls.store}/products/${product.slug}`,
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, alt: ogImageAlt }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Helvety Store`,
      description: product.shortDescription,
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, alt: ogImageAlt }],
      }),
    },
  };
}

/**
 * Product detail page for viewing a specific product.
 * No auth required - users can browse products without logging in.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const [{ slug }, headersList] = await Promise.all([params, headers()]);
  const nonce = headersList.get("x-nonce") ?? "";

  const product = getProductBySlug(slug);

  const jsonLdImage =
    product?.media?.screenshots?.[0]?.src ??
    (product?.image?.startsWith("/")
      ? `${urls.home}${product.image}`
      : undefined);

  // Build Product JSON-LD structured data for search engines
  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription,
        url: `${urls.store}/products/${product.slug}`,
        brand: {
          "@type": "Organization",
          name: "Helvety",
        },
        ...(jsonLdImage && { image: jsonLdImage }),
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
