import { getAllProducts } from "@/lib/data/products";

import type { MetadataRoute } from "next";

/**
 * Sitemap for public pages
 * Dynamically generates entries for all products
 * Note: /account, /subscriptions, /tenants require auth and are excluded
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public store pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `https://helvety.com/store/products/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: "https://helvety.com/store",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://helvety.com/store/products",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...productEntries,
  ];
}
