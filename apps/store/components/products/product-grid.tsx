/**
 * Product grid component
 * Responsive grid layout for product cards
 */

import { cn } from "@helvety/shared/utils";
import { Package } from "lucide-react";

import { ProductCard } from "./product-card";

import type { Product } from "@/lib/types/products";

/** Props for the ProductGrid component. */
interface ProductGridProps {
  products: Product[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

/** Renders a responsive grid of product cards. */
export function ProductGrid({
  products,
  className,
  columns = 3,
}: ProductGridProps) {
  if (products.length === 0) {
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
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/** Empty state shown when no products match the current filter. */
function ProductGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Package className="text-muted-foreground size-6" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No products found</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Try adjusting your filters or check back later for new products.
      </p>
    </div>
  );
}

/** Props for the product grid loading skeleton. */
interface ProductGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/** Renders loading skeleton placeholders for the product grid. */
export function ProductGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: ProductGridSkeletonProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key -- Static skeleton items
        <ProductCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

/** Loading skeleton for a product card. */
function ProductCardSkeleton() {
  return (
    <div className="bg-muted/40 ring-foreground/10 flex min-h-[420px] flex-col overflow-hidden rounded-xl shadow-xs ring-1">
      {/* Inner content panel skeleton */}
      <div className="bg-card mx-3 mt-auto mb-3 flex flex-col rounded-lg p-5 shadow-sm">
        <div className="space-y-2">
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        </div>
        <div className="mt-4 flex-1 space-y-2">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
