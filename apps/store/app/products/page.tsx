import { STORE_PRODUCTS_PAGE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { urls } from "@helvety/shared/config";

import { ProductGrid } from "@/components/products/product-grid";
import { ProductsCatalog } from "@/components/products/products-catalog";
import { catalogArtwork } from "@/lib/data/catalog-card-artwork";
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
 * Server-renders artwork cards from cached catalog metadata plus
 * {@link catalogArtwork}. Category filtering hides those cards in place.
 */
export default async function ProductsPage() {
  const initialCards = await getCachedStoreCatalogCards();
  const cards = initialCards.map((card) => ({
    ...card,
    ...catalogArtwork(card.id),
  }));

  return (
    <section>
      <ProductsCatalog categories={cards.map((card) => card.category)}>
        <ProductGrid cards={cards} priorityCount={3} />
      </ProductsCatalog>
    </section>
  );
}
