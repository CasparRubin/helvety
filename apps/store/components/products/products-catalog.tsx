"use client";

import { HELVETY_ECOSYSTEM_PRODUCT_SECTIONS } from "@helvety/shared/helvety-ecosystem-sections";
import {
  createContext,
  use,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { type FilterType, ProductFilters } from "./product-filters";
import { ProductGridEmpty } from "./product-grid-empty";

import type { StoreProductCategory } from "@helvety/shared/store-catalog";

/**
 * Products catalog filter shell.
 * Artwork cards are server-rendered children. This island hides cards by
 * category without fetching `products.ts`.
 */

const CatalogFilterContext = createContext<FilterType>("all");

/** Props for one server-rendered card slot that participates in filtering. */
interface CatalogCardFrameProps {
  category: StoreProductCategory;
  children: ReactNode;
}

/** Hides a catalog card when the active filter does not match its category. */
export function CatalogCardFrame({
  category,
  children,
}: CatalogCardFrameProps) {
  const filter = use(CatalogFilterContext);
  const hidden = filter !== "all" && category !== filter;

  return (
    <div hidden={hidden} className="h-full" data-category={category}>
      {children}
    </div>
  );
}

/** Props for the interactive products catalog. */
interface ProductsCatalogProps {
  categories: readonly StoreProductCategory[];
  children: ReactNode;
}

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog({
  categories,
  children,
}: ProductsCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilter: FilterType) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  const counts = useMemo(() => {
    const result = { all: categories.length } as Record<FilterType, number>;
    for (const section of HELVETY_ECOSYSTEM_PRODUCT_SECTIONS) {
      result[section.slug] = categories.filter(
        (category) => category === section.slug
      ).length;
    }
    return result;
  }, [categories]);

  const visibleCount =
    filter === "all"
      ? categories.length
      : categories.filter((category) => category === filter).length;

  return (
    <CatalogFilterContext.Provider value={filter}>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
            Filter by category, then open a product. Everything here is free.
          </p>
        </div>

        <section className="mb-6">
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">
            Category
          </h2>
          <ProductFilters
            value={filter}
            onChange={handleFilterChange}
            counts={counts}
          />
        </section>

        <div className={isPending ? "opacity-70 transition-opacity" : ""}>
          {visibleCount === 0 ? <ProductGridEmpty /> : children}
        </div>
      </div>
    </CatalogFilterContext.Provider>
  );
}
