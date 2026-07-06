"use client";

/**
 * Product detail hero: full-bleed artwork with title, badges, and summary in the lower third.
 * Category and artist badges reuse {@link ./product-badge} (same styling as catalog cards).
 */

import Image from "next/image";

import { productArtwork } from "@/lib/data/product-artwork";

import { ArtistBadge, CategoryBadge, ReleaseDateBadge } from "./product-badge";

import type { Product } from "@/lib/types/products";

const HERO_IMAGE_FALLBACK = productArtwork.artwork1;

/** Hero region for a product detail page - image fills the frame; copy sits in the bottom third. */
export function ProductDetailHero({ product }: { product: Product }) {
  const src = product.image ?? HERO_IMAGE_FALLBACK;

  return (
    <section
      className="ring-foreground/10 relative w-full overflow-hidden rounded-2xl shadow-md ring-1"
      aria-labelledby="product-detail-title"
    >
      <div className="relative h-[min(48vh,560px)] max-h-[640px] min-h-[340px] w-full">
        <Image
          src={src}
          alt=""
          fill
          preload
          sizes="(max-width: 1024px) 100vw, min(896px, 100vw)"
          className="object-cover"
        />
        {/* Top ~2/3: image only. Bottom ~1/3: overlapping content panel. */}
        <div className="pointer-events-none absolute inset-0 grid grid-rows-[3fr_2fr] sm:grid-rows-[2fr_1fr]">
          <div className="min-h-0" aria-hidden />
          <div className="pointer-events-auto flex min-h-0 flex-col justify-end p-4 sm:p-5 md:p-8">
            <div className="bg-card border-border/80 rounded-xl border p-5 shadow-lg md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  id="product-detail-title"
                  className="text-foreground w-full text-2xl font-bold tracking-tight text-balance sm:text-3xl md:text-4xl"
                >
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={product.category} />
                  {product.metadata?.releaseDate && (
                    <ReleaseDateBadge isoDate={product.metadata.releaseDate} />
                  )}
                  {product.artist && (
                    <ArtistBadge artist={product.artist} showIcon={false} />
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-3 max-w-3xl text-base leading-relaxed text-pretty md:text-lg">
                {product.shortDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
