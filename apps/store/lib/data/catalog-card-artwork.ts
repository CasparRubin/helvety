/**
 * Artwork and artist credit for catalog cards.
 * Kept separate from `products.ts` so the listing can server-render images
 * without pulling long-form product copy into the catalog module graph.
 */

import { productArtwork } from "@/lib/data/product-artwork";

import type {
  StoreProductCardEntry,
  StoreProductId,
} from "@helvety/shared/store-catalog";
import type { StaticImageData } from "next/image";

/** Image and artist shown on a catalog card. */
export interface CatalogCardArtwork {
  image: StaticImageData;
  artist: string;
}

/** Catalog card metadata plus the artwork rendered on the listing. */
export type CatalogArtworkCard = StoreProductCardEntry & CatalogCardArtwork;

/** Exhaustive artwork assignment keyed by catalog product id. */
export const catalogCardArtwork = {
  "helvety-spo-explorer": {
    image: productArtwork.artwork1,
    artist: "Alexandre Calame",
  },
  "helvety-power-platform-configurator": {
    image: productArtwork.artwork6,
    artist: "Rudolf Koller",
  },
  "helvety-screen-tools": {
    image: productArtwork.artwork8,
    artist: "Ferdinand Hodler",
  },
  "helvety-power-platform-tools": {
    image: productArtwork.artwork2,
    artist: "Alexandre Calame",
  },
  "helvety-pdf": {
    image: productArtwork.artwork7,
    artist: "Alexandre Calame",
  },
  "helvety-image-editor": {
    image: productArtwork.artwork11,
    artist: "Clara von Rappard",
  },
  "helvety-ocr": {
    image: productArtwork.artwork13,
    artist: "Anny Meisser Vonzun",
  },
} as const satisfies Record<StoreProductId, CatalogCardArtwork>;

/** Artwork fields for one catalog product. */
export function catalogArtwork(id: StoreProductId): CatalogCardArtwork {
  return catalogCardArtwork[id];
}
