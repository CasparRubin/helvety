/**
 * Product grid component
 * Responsive grid layout for product cards
 */

import { Package } from "lucide-react";

import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";

import type { Product } from "@/lib/types/products";

interface ProductGridProps {
  products: Product[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

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

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

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

function ProductCardSkeleton() {
  return (
    <div className="bg-card flex flex-col rounded-lg border p-6 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="bg-muted size-10 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="bg-muted h-5 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="bg-muted h-4 w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-24 animate-pulse rounded" />
      </div>
    </div>
  );
}
