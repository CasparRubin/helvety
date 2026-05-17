import type { Product, ProductStatus, ProductType } from "@/lib/types/products";
import type { StaticImageData } from "next/image";

/** Card-level product fields safe to pass from Server Components to client. */
export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  type: ProductType;
  status: ProductStatus;
  category: Product["category"];
  artist?: string;
  imageSrc?: string;
  releaseDate?: string;
}

/** Resolves a catalog image to a string URL for RSC/client props. */
export function productImageSrc(
  image: string | StaticImageData | undefined
): string | undefined {
  if (!image) {
    return undefined;
  }
  return typeof image === "string" ? image : image.src;
}

/** Maps full catalog rows to JSON-serializable card props (no StaticImageData). */
export function toCatalogProducts(products: Product[]): CatalogProduct[] {
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    type: product.type,
    status: product.status,
    category: product.category,
    artist: product.artist,
    imageSrc: productImageSrc(product.image),
    releaseDate: product.metadata?.releaseDate,
  }));
}

/** Expands slim catalog rows into {@link Product} shapes for shared card/grid UI. */
export function catalogProductToCardProduct(product: CatalogProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    type: product.type,
    status: product.status,
    category: product.category,
    artist: product.artist,
    image: product.imageSrc,
    description: { intro: product.shortDescription },
    features: [],
    pricing: { tiers: [], hasFreeTier: true, hasYearlyPricing: false },
    metadata: product.releaseDate
      ? { releaseDate: product.releaseDate }
      : undefined,
  };
}
