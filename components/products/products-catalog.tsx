"use client";

/**
 * Products catalog component
 * Displays all available products with filtering options
 */

import { useState, useMemo } from "react";

import { CommandBar } from "@/components/command-bar";
import { getAllProducts, getFilteredProducts } from "@/lib/data/products";

import { type FilterType } from "./product-filters";
import { ProductGrid } from "./product-grid";

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
    <>
      <CommandBar
        variant="catalog"
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />
      <div className="container mx-auto px-4 py-8">
        <ProductGrid products={filteredProducts} columns={3} />
      </div>
    </>
  );
}
