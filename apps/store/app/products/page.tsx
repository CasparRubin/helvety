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
 * Catalog data loads in the client (`ProductsCatalog` → `getAllProducts`) so the
 * server page does not import the static products module (keeps Vercel RSC reliable).
 * No auth required to browse; some actions (for example account) still require authentication.
 */
export default function ProductsPage() {
  return (
    <section>
      <ProductsCatalog />
    </section>
  );
}
