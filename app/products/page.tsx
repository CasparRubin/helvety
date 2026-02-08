import { ProductsCatalog } from "@/components/products";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse software and subscriptions from Helvety",
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
