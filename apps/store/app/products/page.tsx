import { STORE_PRODUCTS_PAGE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { urls } from "@helvety/shared/config";

import { ProductsCatalog } from "@/components/products/products-catalog";

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
 * No auth required - users can browse products without logging in.
 * Some product actions (for example account pages) still require authentication.
 */
export default function ProductsPage() {
  return (
    <section>
      <ProductsCatalog />
    </section>
  );
}
