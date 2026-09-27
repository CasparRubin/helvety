/**
 * Product grid component
 * Responsive grid layout for product cards
 */

import { cn } from "@helvety/shared/utils";

import { ProductCard } from "./product-card";
import { ProductGridEmpty } from "./product-grid-empty";
import { CatalogCardFrame } from "./products-catalog";

import type { CatalogArtworkCard } from "@/lib/data/catalog-card-artwork";

/** Props for the ProductGrid component. */
interface ProductGridProps {
  cards: readonly CatalogArtworkCard[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  /** How many leading cards preload artwork (the first row on desktop). */
  priorityCount?: number;
}

/** Renders a responsive grid of product cards. */
export function ProductGrid({
  cards,
  className,
  columns = 3,
  priorityCount = 3,
}: ProductGridProps) {
  if (cards.length === 0) {
    return <ProductGridEmpty />;
  }

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {cards.map((card, index) => (
        <CatalogCardFrame key={card.id} category={card.category}>
          <ProductCard
            product={{
              slug: card.slug,
              name: card.name,
              shortDescription: card.shortDescription,
              category: card.category,
              image: card.image,
              artist: card.artist,
              releaseDate: card.releaseDate,
            }}
            preload={index < priorityCount}
          />
        </CatalogCardFrame>
      ))}
    </div>
  );
}
