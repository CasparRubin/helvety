import { STORE_PRODUCTS_PAGE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { urls } from "@helvety/shared/config";

import { ProductsCatalog } from "@/components/products/products-catalog";
import { getCachedStoreCatalogCards } from "@/lib/data/product-catalog-cache";

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
 * Server-renders card metadata from `@helvety/shared/store-catalog`; the client
 * catalog hydrates artwork and filters after mount.
 */
export default async function ProductsPage() {
  const initialCards = await getCachedStoreCatalogCards();

  return (
    <section>
      <ProductsCatalog initialCards={initialCards} />
    </section>
  );
}
