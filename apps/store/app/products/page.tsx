import { urls } from "@helvety/shared/config";

import { ProductsCatalog } from "@/components/products/products-catalog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse software and subscriptions from Helvety",
  alternates: {
    canonical: `${urls.store}/products`,
  },
};

/**
 * Products catalog page.
 * No auth required - users can browse products without logging in.
 * Login is required only for purchasing.
 */
export default function ProductsPage() {
  return (
    <main>
      <ProductsCatalog />
    </main>
  );
}
