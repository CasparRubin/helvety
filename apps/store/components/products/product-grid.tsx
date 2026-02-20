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
