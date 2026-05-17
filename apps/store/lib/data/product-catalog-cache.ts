import { cache } from "react";

import { getAllProducts, getProductBySlug } from "./products";

import type { Product } from "@/lib/types/products";

/**
 * Per-request cached catalog lookup for static in-repo product data.
 * Deduplicates metadata + page lookups within a single RSC render.
 */
export const getCachedProductBySlug = cache(
  (slug: string): Product | undefined => getProductBySlug(slug)
);

/**
 * Per-request cached product list for static store routes.
 */
export const getCachedAllProducts = cache((): Product[] => getAllProducts());
