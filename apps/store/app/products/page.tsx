import { STORE_PRODUCTS_PAGE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { urls } from "@helvety/shared/config";

import { ProductsCatalog } from "@/components/products/products-catalog";
import { getCachedAllProducts } from "@/lib/data/product-catalog-cache";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: STORE_PRODUCTS_PAGE_DESCRIPTION,
  alternates: {
    canonical: `${urls.store}/products`,
  },
};

/**
 * Products catalog page.
 * Server-renders the static catalog via {@link getCachedAllProducts} → {@link ProductsCatalog}
 * `initialProducts` so the grid is in HTML even if client JS fails.
 * No auth required to browse; some actions (for example account) still require authentication.
 */
export default function ProductsPage() {
  const products = getCachedAllProducts();

  return (
    <section>
      <ProductsCatalog initialProducts={products} />
    </section>
  );
}
