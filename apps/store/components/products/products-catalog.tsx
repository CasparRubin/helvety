"use client";

import { useSyncExternalStore, useMemo, useState, useTransition } from "react";

import { ProductCatalogTextCard } from "@/components/products/product-catalog-text-card";
import { getAllProducts, getFilteredProducts } from "@/lib/data/products";

import { type FilterType } from "./product-filters";
import { ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";

import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/**
 * Products catalog component (client filter shell).
 * SSR uses {@link ProductCatalogTextCard} from `initialCards`; after mount loads
 * full `Product` rows (with artwork) via `getAllProducts()`.
 */

const subscribeNoop = () => () => {};
const getClientEnhanced = () => true;
const getServerEnhanced = () => false;

/** Props for the interactive products catalog. */
interface ProductsCatalogProps {
  initialCards: StoreProductCardEntry[];
}

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog({ initialCards }: ProductsCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();
  const isEnhanced = useSyncExternalStore(
    subscribeNoop,
    getClientEnhanced,
    getServerEnhanced
  );

  const handleFilterChange = (newFilter: FilterType) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  const allProducts = useMemo(
    () => (isEnhanced ? getAllProducts() : []),
    [isEnhanced]
  );

  const filteredCards = useMemo(() => {
    if (filter === "all") {
      return initialCards;
    }
    return initialCards.filter((card) => card.type === filter);
  }, [filter, initialCards]);

  const counts = useMemo(() => {
    let software = 0;
    let saas = 0;
    for (const card of initialCards) {
      if (card.type === "software") software++;
      else if (card.type === "saas") saas++;
    }
    return { all: initialCards.length, software, saas };
  }, [initialCards]);

  const filteredProducts = useMemo(() => {
    if (!isEnhanced) {
      return [];
    }
    if (filter === "all") {
      return allProducts;
    }
    return getFilteredProducts({ type: filter });
  }, [filter, allProducts, isEnhanced]);

  return (
    <div className="py-8">
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
        {isEnhanced ? (
          <ProductGrid products={filteredProducts} columns={3} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => (
              <ProductCatalogTextCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
