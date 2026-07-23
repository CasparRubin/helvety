import { urls } from "@helvety/shared/config";

import { getCachedStoreCatalogCards } from "@/lib/data/product-catalog-cache";

import type { MetadataRoute } from "next";

/**
 * Sitemap for public store pages.
 * Catalog slugs come from the tagged `unstable_cache` card list.
 * Excludes /store/account (auth-gated) and llms.txt.
 */

/** Generates the sitemap for public store pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await getCachedStoreCatalogCards();
  const lastModified = new Date();

  const productEntries: MetadataRoute.Sitemap = cards.map((card) => ({
    url: `${urls.store}/products/${card.slug}`,
    lastModified,
  }));

  return [
    {
      url: urls.store,
      lastModified,
    },
    {
      url: `${urls.store}/products`,
      lastModified,
    },
    ...productEntries,
  ];
}
