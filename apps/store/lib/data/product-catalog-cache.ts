import { getStoreCatalogNewestFirst } from "@helvety/shared/store-catalog";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { getAllProducts } from "./products";

import type { Product } from "@/lib/types/products";
import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/** Next.js cache tag for the public store catalog card list. */
const STORE_CATALOG_CACHE_TAG = "store-catalog" as const;

/**
 * Cross-request cached store catalog cards (text metadata only; no artwork imports).
 * The catalog is bundled with the deployment, so it lives for the deployment lifetime.
 */
export async function getCachedStoreCatalogCards(): Promise<
  StoreProductCardEntry[]
> {
  "use cache";
  cacheLife("max");
  cacheTag(STORE_CATALOG_CACHE_TAG);
  return getStoreCatalogNewestFirst();
}

/**
 * Per-request cached full product list for routes that need Store `Product` rows.
 */
export const getCachedAllProducts = cache((): Product[] => getAllProducts());
