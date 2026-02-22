/**
 * Product card component
 * Displays a product in the catalog grid. The entire card is a single link to the
 * product detail page (/products/[slug]); no overlay or nested links.
 *
 * Uses a two-layer design: an outer artwork background frame with an inner
 * solid-color content panel for readability.
 */

import { cn } from "@helvety/shared/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatStartingFrom } from "@/lib/utils/pricing";

import { ArtistBadge, ProductBadge, StatusBadge } from "./product-badge";

import type { Product } from "@/lib/types/products";

/** Props for the product card */
interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Renders a product card that links to the product detail page.
 * Card and "View Details" share one link; clicking anywhere navigates to /products/[slug].
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const priceDisplay = formatStartingFrom(
    product.pricing,
    product.pricing.tiers[0]?.currency
  );
  const productHref = `/products/${product.slug}`;

  return (
    <Link
      href={productHref}
      className="block h-full"
      aria-label={`View ${product.name} details`}
    >
      {/* Outer layer: artwork background frame */}
      <div
        className={cn(
          "group ring-foreground/10 relative flex min-h-[420px] flex-col overflow-hidden rounded-xl shadow-xs ring-1 transition-shadow hover:shadow-lg",
          className
        )}
      >
        {/* Background artwork — desaturated at rest, full color on hover */}
        <Image
          src={product.image ?? "/store/artwork_1.jpg"}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover grayscale-[50%] transition-[filter] duration-500 group-hover:grayscale-0"
          priority
        />

        {/* Badges: positioned over the image */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center justify-end gap-2">
          <ProductBadge type={product.type} showIcon={false} />
          {product.status !== "available" && (
            <StatusBadge status={product.status} />
          )}
          {product.artist && (
            <ArtistBadge artist={product.artist} showIcon={false} />
          )}
        </div>

        {/* Inner layer: solid content panel */}
        <div className="bg-card/95 relative mx-3 mt-auto mb-3 flex flex-col rounded-lg shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
          {/* Header: name */}
          <div className="px-5 pt-5">
            <h3 className="text-card-foreground line-clamp-1 text-lg leading-tight font-semibold">
              {product.name}
            </h3>
          </div>

          {/* Description: hidden at rest, revealed on hover */}
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="text-muted-foreground line-clamp-4 px-5 pt-3 text-sm leading-relaxed">
                {product.shortDescription}
              </p>
            </div>
          </div>

          {/* Footer: pricing + CTA */}
          <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-5">
            <div className="text-sm font-medium">
              {product.pricing.hasFreeTier ? (
                <span className="text-green-600 dark:text-green-400">Free</span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400">
                  {priceDisplay}
                </span>
              )}
            </div>
            <span
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-medium",
                "text-card-foreground/80 transition-colors",
                "group-hover:text-card-foreground"
              )}
            >
              View Details
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
