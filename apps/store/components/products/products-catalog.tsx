"use client";

import { HELVETY_ECOSYSTEM_PRODUCT_SECTIONS } from "@helvety/shared/helvety-ecosystem-sections";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { ProductCatalogTextCard } from "@/components/products/product-catalog-text-card";

import { type FilterType, ProductFilters } from "./product-filters";
import { ProductGrid } from "./product-grid";

import type { Product } from "@/lib/types/products";
import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/**
 * Products catalog component (client filter shell).
 * SSR uses {@link ProductCatalogTextCard} from `initialCards`; after mount
 * dynamically imports full `Product` rows (with artwork) so the heavy
 * `products.ts` / artwork chunk stays out of the initial client graph.
 */

/** No-op subscribe for `useSyncExternalStore` client-only hydration gate. */
const subscribeNoop = () => () => {};

/** Returns true on the client after hydration. */
const getClientEnhanced = () => true;

/** Returns false during SSR. */
const getServerEnhanced = () => false;

/** Props for the interactive products catalog. */
interface ProductsCatalogProps {
  initialCards: StoreProductCardEntry[];
}

/** Renders the product catalog with filter bar and responsive grid. */
export function ProductsCatalog({ initialCards }: ProductsCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isPending, startTransition] = useTransition();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const isEnhanced = useSyncExternalStore(
    subscribeNoop,
    getClientEnhanced,
    getServerEnhanced
  );

  useEffect(() => {
    if (!isEnhanced) {
      return;
    }

    let cancelled = false;

    void import("@/lib/data/products")
      .then((mod) => {
        if (cancelled) {
          return;
        }
        setAllProducts(mod.getAllProducts());
        setProductsReady(true);
      })
      .catch(() => {
        // Keep SSR text cards if the artwork chunk fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [isEnhanced]);

  const handleFilterChange = (newFilter: FilterType) => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  const filteredCards = useMemo(() => {
    if (filter === "all") {
      return initialCards;
    }
    return initialCards.filter((card) => card.category === filter);
  }, [filter, initialCards]);

  const counts = useMemo(() => {
    const result = { all: initialCards.length } as Record<FilterType, number>;
    for (const section of HELVETY_ECOSYSTEM_PRODUCT_SECTIONS) {
      result[section.slug] = initialCards.filter(
        (card) => card.category === section.slug
      ).length;
    }
    return result;
  }, [initialCards]);

  const filteredProducts = useMemo(() => {
    if (!productsReady) {
      return [];
    }
    if (filter === "all") {
      return allProducts;
    }
    return allProducts.filter((product) => product.category === filter);
  }, [filter, allProducts, productsReady]);

  const showArtworkGrid = isEnhanced && productsReady;

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-pretty">
          Filter by category, read the long-form About panels, then jump into
          each repo or installer. Everything here is free to use with no
          subscription upsell.
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
        {showArtworkGrid ? (
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
