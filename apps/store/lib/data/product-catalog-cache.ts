import { cache } from "react";

import { getAllProducts } from "./products";

import type { Product } from "@/lib/types/products";

/**
 * Per-request cached product list for static store routes.
 */
export const getCachedAllProducts = cache((): Product[] => getAllProducts());
