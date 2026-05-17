import { cn } from "@helvety/shared/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { productArtwork } from "@/lib/data/product-artwork";

import {
  ArtistBadge,
  ProductBadge,
  ReleaseDateBadge,
  StatusBadge,
} from "./product-badge";

import type { Product } from "@/lib/types/products";

const PRODUCT_IMAGE_FALLBACK = productArtwork.artwork1;

/** Props for rendering a single catalog product card. */
interface ProductCardProps {
  product: Product;
  className?: string;
}

/** Renders a single-link product card used in the catalog grid. */
export function ProductCard({ product, className }: ProductCardProps) {
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
          "group ring-foreground/10 relative flex min-h-[400px] flex-col overflow-hidden rounded-xl shadow-xs ring-1 transition-shadow hover:shadow-lg",
          className
        )}
      >
        {/* Background artwork - desaturated at rest, full color on hover */}
        <Image
          src={product.image ?? PRODUCT_IMAGE_FALLBACK}
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover grayscale-[50%] transition-[filter] duration-500 group-hover:grayscale-0"
        />

        {/* Badges: positioned over the image */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center justify-end gap-2">
          <ProductBadge type={product.type} showIcon={false} />
          {product.status !== "available" && (
            <StatusBadge status={product.status} />
          )}
          {product.metadata?.releaseDate && (
            <ReleaseDateBadge
              isoDate={product.metadata.releaseDate}
              showIcon={false}
            />
          )}
          {product.artist && (
            <ArtistBadge artist={product.artist} showIcon={false} />
          )}
        </div>

        {/* Inner layer: solid content panel */}
        <div className="bg-card/95 relative mx-3 mt-auto mb-3 flex flex-col rounded-lg shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
          {/* Description: always on touch; expand on hover for pointer devices */}
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out",
              "max-md:grid-rows-[1fr]",
              "grid-rows-[0fr] [@media(hover:hover)]:group-hover:grid-rows-[1fr]"
            )}
          >
            <div className="overflow-hidden">
              <p className="text-muted-foreground line-clamp-4 px-5 pt-4 text-sm leading-relaxed">
                {product.shortDescription}
              </p>
            </div>
          </div>

          {/* Title and CTA on one row */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <h3 className="text-card-foreground min-w-0 flex-1 truncate text-lg leading-tight font-semibold">
              {product.name}
            </h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-sm font-medium",
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
