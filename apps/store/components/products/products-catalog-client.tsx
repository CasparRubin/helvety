"use client";

import dynamic from "next/dynamic";

/** Client-only catalog grid (avoids server import of `products.ts` / webp bundle). */
export const ProductsCatalogClient = dynamic(
  () => import("./products-catalog").then((mod) => mod.ProductsCatalog),
  { ssr: false }
);
