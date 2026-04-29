import { urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { JsonLdScript } from "@helvety/ui/json-ld-script";

import { getProductBySlug } from "@/lib/data/products";

import { ProductDetailClient } from "./product-detail-client";

import type { Product } from "@/lib/types/products";
import type { Metadata } from "next";

/** Props for the product detail page */
interface ProductPageProps {
  /** Route params containing the product slug */
  params: Promise<{ slug: string }>;
}

/** Resolves a product image source to an absolute URL for SEO metadata. */
function getAbsoluteProductImageUrl(product: Product): string | undefined {
  const imageSrc =
    typeof product.image === "string" ? product.image : product.image?.src;
  if (!imageSrc?.startsWith("/")) {
    return undefined;
  }
  return `${urls.home}${imageSrc}`;
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

  const screenshot = product.media?.screenshots?.[0];
  const ogImageUrl = screenshot?.src ?? getAbsoluteProductImageUrl(product);
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
  const [{ slug }, nonce] = await Promise.all([params, getRequestCspNonce()]);

  const product = getProductBySlug(slug);

  const jsonLdImage =
    product?.media?.screenshots?.[0]?.src ??
    (product ? getAbsoluteProductImageUrl(product) : undefined);

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
        <JsonLdScript nonce={nonce ?? undefined} json={productJsonLd} />
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
