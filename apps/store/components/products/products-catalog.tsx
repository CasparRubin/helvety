"use client";

/**
 * Products catalog component (client filter shell).
 * Receives serializable card rows from the server page (`initialProducts` from `lib/data/catalog-product.ts`).
 */

import { useMemo, useState, useTransition } from "react";

import {
  catalogProductToCardProduct,
  type CatalogProduct,
} from "@/lib/data/catalog-product";
import { getFilteredProducts } from "@/lib/data/products";

import { type FilterType } from "./product-filters";
import { ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";

import type { Product } from "@/lib/types/products";

/** Props for {@link ProductsCatalog}. */
interface ProductsCatalogProps {
  /** Server-provided catalog rows (serializable card fields; resilient if client JS fails). */
  initialProducts: CatalogProduct[];
}

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog({ initialProducts }: ProductsCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilter: FilterType) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  const counts = useMemo(() => {
    let software = 0;
    let physical = 0;
    let saas = 0;
    for (const p of initialProducts) {
      if (p.type === "software") software++;
      else if (p.type === "physical") physical++;
      else if (p.type === "saas") saas++;
    }
    return { all: initialProducts.length, software, physical, saas };
  }, [initialProducts]);

  const filteredProducts = useMemo((): Product[] => {
    if (filter === "all") {
      return initialProducts.map(catalogProductToCardProduct);
    }
    return getFilteredProducts({ type: filter });
  }, [filter, initialProducts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
          Filter by delivery model, read the long-form About panels, then jump
          into each repo or installer. Everything here is free to use with no
          subscription upsell.
        </p>
      </div>
      <section className="mb-6">
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">
          Product type
        </h2>
        <ProductFilters
          value={filter}
          onChange={handleFilterChange}
          counts={counts}
        />
      </section>
      <div className={isPending ? "opacity-70 transition-opacity" : ""}>
        <ProductGrid products={filteredProducts} columns={3} />
      </div>
    </div>
  );
}
