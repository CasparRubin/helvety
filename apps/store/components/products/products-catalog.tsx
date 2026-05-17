"use client";

/**
 * Products catalog component (client filter shell).
 * Loads static product data via `getAllProducts()` in the client bundle only.
 */

import { useMemo, useState, useTransition } from "react";

import { getAllProducts, getFilteredProducts } from "@/lib/data/products";

import { type FilterType } from "./product-filters";
import { ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilter: FilterType) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  const allProducts = useMemo(() => getAllProducts(), []);

  const counts = useMemo(() => {
    let software = 0;
    let physical = 0;
    let saas = 0;
    for (const p of allProducts) {
      if (p.type === "software") software++;
      else if (p.type === "physical") physical++;
      else if (p.type === "saas") saas++;
    }
    return { all: allProducts.length, software, physical, saas };
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (filter === "all") {
      return allProducts;
    }
    return getFilteredProducts({ type: filter });
  }, [filter, allProducts]);

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