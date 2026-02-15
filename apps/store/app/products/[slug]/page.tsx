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

  const ogImage = product.media?.screenshots?.[0];

  return {
    title: product.name,
    description: product.shortDescription,
    keywords: product.metadata?.keywords,
    alternates: {
      canonical: `https://helvety.com/store/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Helvety Store`,
      description: product.shortDescription,
      url: `https://helvety.com/store/products/${product.slug}`,
      ...(ogImage && {
        images: [{ url: ogImage.src, alt: ogImage.alt }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Helvety Store`,
      description: product.shortDescription,
      ...(ogImage && {
        images: [{ url: ogImage.src, alt: ogImage.alt }],
      }),
    },
  };
}

/**
 * Product detail page for viewing a specific product.
 * No auth required - users can browse products without logging in.
 * Login is required only for purchasing.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  // Build Product JSON-LD structured data for search engines
  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription,
        url: `https://helvety.com/store/products/${product.slug}`,
        brand: {
          "@type": "Organization",
          name: "Helvety",
        },
        ...(product.media?.screenshots?.[0] && {
          image: product.media.screenshots[0].src,
        }),
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
