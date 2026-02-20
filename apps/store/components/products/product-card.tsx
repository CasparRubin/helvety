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

import { ProductBadge, StatusBadge } from "./product-badge";

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
          src="/store/artwork_1.jpg"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover grayscale-[50%] transition-[filter] duration-500 group-hover:grayscale-0"
          priority
        />

        {/* Inner layer: solid content panel */}
        <div className="bg-card/95 relative mx-3 mt-auto mb-3 flex flex-col rounded-lg shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
          {/* Header: name + badges */}
          <div className="space-y-2 px-5 pt-5">
            <h3 className="text-card-foreground line-clamp-1 text-lg leading-tight font-semibold">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <ProductBadge type={product.type} showIcon={false} />
              {product.status !== "available" && (
                <StatusBadge status={product.status} />
              )}
            </div>
          </div>

          {/* Content: description */}
          <div className="flex-1 px-5 pt-3">
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Footer: pricing + CTA */}
          <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-5">
            <div className="text-sm font-medium">
              {product.pricing.hasFreeTier ? (
                <span className="text-green-600 dark:text-green-400">
                  Free to start
                </span>
              ) : (
                <span className="text-muted-foreground">{priceDisplay}</span>
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
