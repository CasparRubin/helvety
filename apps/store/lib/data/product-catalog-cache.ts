import { getStoreCatalogNewestFirst } from "@helvety/shared/store-catalog";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getAllProducts } from "./products";

import type { Product } from "@/lib/types/products";
import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/** Next.js cache tag for the public store catalog card list (use with revalidateTag). */
const STORE_CATALOG_CACHE_TAG = "store-catalog" as const;

/**
 * Cross-request cached store catalog cards (text metadata only; no artwork imports).
 */
export const getCachedStoreCatalogCards = unstable_cache(
  async (): Promise<StoreProductCardEntry[]> => getStoreCatalogNewestFirst(),
  ["store-catalog-cards"],
  { tags: [STORE_CATALOG_CACHE_TAG], revalidate: 3600 }
);

/**
 * Per-request cached full product list for routes that need Store `Product` rows.
 */
export const getCachedAllProducts = cache((): Product[] => getAllProducts());
