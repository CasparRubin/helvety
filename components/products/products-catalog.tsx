"use client";

/**
 * Products catalog component
 * Displays all available products with filtering options
 */

import { useState, useMemo } from "react";

import { getAllProducts, getFilteredProducts } from "@/lib/data/products";

import { type FilterType } from "./product-filters";
import { ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog() {
  const [filter, setFilter] = useState<FilterType>("all");

  const allProducts = getAllProducts();

  // Calculate counts for each filter
  const counts = useMemo(() => {
    const all = allProducts.length;
    const software = allProducts.filter((p) => p.type === "software").length;
    const physical = allProducts.filter((p) => p.type === "physical").length;

    return { all, software, physical } as Record<FilterType, number>;
  }, [allProducts]);

  // Filter products based on selected filter
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
        <p className="text-muted-foreground mt-1">
          Browse software, subscriptions, and apparel from Helvety
        </p>
      </div>
      <section className="mb-6">
        <h2 className="text-muted-foreground mb-2 text-sm font-medium">
          Product type
        </h2>
        <ProductFilters value={filter} onChange={setFilter} counts={counts} />
      </section>
      <ProductGrid products={filteredProducts} columns={3} />
    </div>
  );
}
