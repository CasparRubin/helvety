import { getLocalAppHref, urls } from "@helvety/shared/config";
import {
  getStoreCatalogNewestFirst,
  storeProductCategoryBadgeLabel,
  storeProductTypeBadgeLabel,
  type StoreProductId,
} from "@helvety/shared/store-catalog";
import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Button } from "@helvety/ui/button";
import {
  Building2,
  FileText,
  ImageUp,
  ListTodo,
  Monitor,
  NotebookPen,
  Puzzle,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

/**
 * One Lucide icon per product id. Typed as
 * `Record<StoreProductId, LucideIcon>` so TypeScript blocks the build if a new
 * product is added to `@helvety/shared/store-catalog` without an icon entry.
 * Same icons as `packages/ui/src/app-switcher.tsx` where applicable.
 */
const STORE_PRODUCT_ICONS: Record<StoreProductId, LucideIcon> = {
  "helvety-pdf": FileText,
  "helvety-image-upscaler": ImageUp,
  "helvety-tasks": ListTodo,
  "helvety-contacts": Users,
  "helvety-notes": NotebookPen,
  "helvety-power-automate-force-v3-false": Puzzle,
  "helvety-spo-explorer": Building2,
  "helvety-screen-tools": Monitor,
};

/** Number of `.showcase-band-vN` variants defined in `apps/web/app/globals.css`. */
const SHOWCASE_BAND_VARIANTS = 4;

/** Random number in `[min, max]` rounded to the nearest half pixel. */
function randomTilePx(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 2) / 2;
}

/**
 * Per-band random pattern tile size, served as inline CSS custom properties.
 * Each variant exposes one knob in `apps/web/app/globals.css`
 * (`--cube-tile`, `--dot-tile`, `--stripe-tile`); the CSS rules fall back to
 * the legacy hard-coded values when the variable is absent.
 *
 * Ranges hug the original values so the visual rhythm stays familiar but each
 * page load reshuffles the patterns. The hero (`.hero-bg-pattern`) is not a
 * `.showcase-band` and is intentionally excluded.
 */
function pickPatternStyle(variant: number): React.CSSProperties {
  switch (variant) {
    case 1:
      return {
        "--cube-tile": `${randomTilePx(22, 30)}px`,
      } as React.CSSProperties;
    case 2:
      return {
        "--dot-tile": `${randomTilePx(18, 26)}px`,
      } as React.CSSProperties;
    case 3:
      return {
        "--stripe-tile": `${randomTilePx(12, 20)}px`,
      } as React.CSSProperties;
    case 4:
      return {
        "--cube-tile": `${randomTilePx(28, 36)}px`,
      } as React.CSSProperties;
    default:
      return {};
  }
}

/**
 * Server-rendered catalog bands: same blurbs and order as the Store (newest
 * release first). Pattern tile sizes are randomized per band on each render so
 * the home page feels fresh without changing the design language; the root
 * layout's CSP-nonce / cookie reads already opt this route into dynamic
 * rendering, so each request resamples the spacings.
 */
export function StoreAppsShowcase() {
  const products = getStoreCatalogNewestFirst();

  return (
    <section aria-label="Helvety products" className="flex flex-col">
      {products.map((product, index) => {
        const Icon = STORE_PRODUCT_ICONS[product.id];
        const storeProductHref = getLocalAppHref(
          `${urls.store}/products/${product.slug}`
        );
        const mediaOnLeft = index % 2 === 0;
        const variant = (index % SHOWCASE_BAND_VARIANTS) + 1;
        const isShaded = index % 2 === 1;

        return (
          <div
            key={product.id}
            className={cn(
              "showcase-band border-border/30 flex flex-col justify-center border-b py-14 last:border-b-0 md:py-20 lg:py-24",
              `showcase-band-v${variant}`,
              isShaded && "showcase-band-shaded"
            )}
            style={pickPatternStyle(variant)}
          >
            <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-10 sm:px-6 md:px-0 md:py-14 lg:py-16">
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
                <div
                  className={cn(
                    "flex items-center justify-center",
                    mediaOnLeft ? "md:order-1" : "md:order-2"
                  )}
                >
                  <Icon
                    aria-hidden
                    strokeWidth={1.2}
                    className="text-foreground/85 size-24 md:size-32 lg:size-40"
                  />
                </div>

                <div
                  className={cn(
                    "flex min-w-0 flex-col gap-4 text-center md:text-left",
                    mediaOnLeft ? "md:order-2" : "md:order-1"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <Badge
                      variant="secondary"
                      className="border-l-primary/70 bg-secondary text-foreground/90 border-l-2 px-2.5 tracking-wide uppercase"
                    >
                      {storeProductTypeBadgeLabel[product.type]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-border/80 bg-card/60 text-foreground/85"
                    >
                      {storeProductCategoryBadgeLabel[product.category]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-border/55 bg-muted/30 text-muted-foreground/90 border-dashed font-normal tracking-wide"
                      aria-label={`Runs on: ${product.runsOn}`}
                    >
                      {product.runsOn}
                    </Badge>
                    {product.isFree ? (
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/5 text-primary font-medium"
                      >
                        Free
                      </Badge>
                    ) : null}
                    {product.isOpenSource ? (
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/5 text-primary font-medium"
                      >
                        Open Source
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="text-foreground text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed text-pretty md:text-lg">
                    {product.shortDescription}
                  </p>
                  <div className="pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={storeProductHref}>More details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
