import { STORE_PRODUCTS_PAGE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { urls } from "@helvety/shared/config";

import { ProductsCatalogClient } from "@/components/products/products-catalog-client";

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
 * Grid loads client-only via {@link ProductsCatalogClient} so the server never
 * imports `products.ts` (webp artwork stays in the client chunk).
 */
export default function ProductsPage() {
  return (
    <section>
      <ProductsCatalogClient />
    </section>
  );
}
