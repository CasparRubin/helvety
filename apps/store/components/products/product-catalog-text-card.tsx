import { ecosystemCategoryTitle } from "@helvety/shared/helvety-ecosystem-sections";
import Link from "next/link";

import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/** Props for a server-rendered catalog card without artwork imports. */
interface ProductCatalogTextCardProps {
  card: StoreProductCardEntry;
}

/** Lightweight SSR product card for crawlers and first paint (no webp bundle). */
export function ProductCatalogTextCard({ card }: ProductCatalogTextCardProps) {
  return (
    <Link
      href={`/products/${card.slug}`}
      prefetch={false}
      className="border-border bg-card hover:bg-accent/40 block rounded-xl border p-5 shadow-xs transition-colors"
      aria-label={`View ${card.name} details`}
    >
      <article>
        <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          {ecosystemCategoryTitle(card.category)}
        </div>
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {card.name}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">
          {card.shortDescription}
        </p>
      </article>
    </Link>
  );
}
