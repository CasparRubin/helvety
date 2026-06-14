/**
 * Store catalog badge components (cards and product detail hero).
 * - {@link ProductBadge}: per-type tinted surfaces (sky / violet / amber).
 * - {@link ArtistBadge}: frosted card surface for readable credit over artwork.
 * - {@link ReleaseDateBadge}: release date badge variant.
 */

import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Calendar, Cloud, Download, Package, Palette } from "lucide-react";

import { formatStoreReleaseDate } from "@/lib/utils/format-release-date";

import type { ProductType } from "@/lib/types/products";

/** Props for the ProductBadge component. */
interface ProductBadgeProps {
  type: ProductType;
  className?: string;
  showIcon?: boolean;
}

const typeConfig: Record<
  ProductType,
  {
    label: string;
    icon: typeof Cloud;
    className: string;
  }
> = {
  saas: {
    label: "Web App",
    icon: Cloud,
    className:
      "border-sky-500/35 bg-sky-500/15 text-sky-950 dark:bg-sky-500/25 dark:text-sky-100",
  },
  software: {
    label: "Software",
    icon: Download,
    className:
      "border-violet-500/35 bg-violet-500/15 text-violet-950 dark:bg-violet-500/25 dark:text-violet-100",
  },
  physical: {
    label: "Physical",
    icon: Package,
    className:
      "border-amber-500/35 bg-amber-500/15 text-amber-950 dark:bg-amber-500/25 dark:text-amber-100",
  },
};

/** Renders a product type badge with a distinct tinted surface per {@link ProductType}. */
export function ProductBadge({
  type,
  className,
  showIcon = true,
}: ProductBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", config.className, className)}
    >
      {showIcon && <Icon className="size-3" />}
      {config.label}
    </Badge>
  );
}

/** Props for the release date badge (YYYY-MM-DD in product metadata). */
interface ReleaseDateBadgeProps {
  isoDate: string;
  className?: string;
  showIcon?: boolean;
}

/** Renders a catalog release date badge. */
export function ReleaseDateBadge({
  isoDate,
  className,
  showIcon = true,
}: ReleaseDateBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5", className)}>
      {showIcon && <Calendar className="size-3" />}
      {formatStoreReleaseDate(isoDate)}
    </Badge>
  );
}

/** Props for the artist badge component. */
interface ArtistBadgeProps {
  artist: string;
  className?: string;
  showIcon?: boolean;
}

/** Frosted surface for readable text over product artwork. */
const artistBadgeSurfaceClassName =
  "border-border/60 bg-card/90 text-card-foreground shadow-sm backdrop-blur-sm";

/** Renders "Art by <name>" with a frosted semi-opaque surface for readability over artwork. */
export function ArtistBadge({
  artist,
  className,
  showIcon = true,
}: ArtistBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", artistBadgeSurfaceClassName, className)}
    >
      {showIcon && <Palette className="size-3" />}
      {`Art by ${artist}`}
    </Badge>
  );
}
