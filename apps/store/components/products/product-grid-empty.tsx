import { Package } from "lucide-react";

/** Empty state shown when a catalog filter matches no products. */
export function ProductGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Package className="text-muted-foreground size-6" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No products found</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Try adjusting your filters to see available products.
      </p>
    </div>
  );
}
