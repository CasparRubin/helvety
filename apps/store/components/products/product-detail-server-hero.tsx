import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/** Props for the server-rendered product detail hero copy. */
interface ProductDetailServerHeroProps {
  card: StoreProductCardEntry;
}

/**
 * Server-rendered title and summary for product detail pages.
 * Full artwork and CTAs hydrate in {@link ProductDetailClient}.
 */
export function ProductDetailServerHero({
  card,
}: ProductDetailServerHeroProps) {
  return (
    <header className="border-border bg-card mb-6 rounded-xl border p-6 shadow-xs">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {card.type}
      </p>
      <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance md:text-4xl">
        {card.name}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-3xl text-pretty">
        {card.shortDescription}
      </p>
    </header>
  );
}
