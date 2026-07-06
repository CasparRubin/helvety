/**
 * Store catalog badge components (cards and product detail hero).
 * - {@link CategoryBadge}: frosted category label over artwork.
 * - {@link ArtistBadge}: frosted card surface for readable credit over artwork.
 * - {@link ReleaseDateBadge}: frosted release date badge over artwork.
 */

import { ecosystemCategoryTitle } from "@helvety/shared/helvety-ecosystem-sections";
import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Calendar, Palette } from "lucide-react";

import { formatStoreReleaseDate } from "@/lib/utils/format-release-date";

import type { ProductCategory } from "@/lib/types/products";

/** Frosted surface for readable text over product artwork. */
const overlayBadgeSurfaceClassName =
  "border-border/60 bg-card/90 text-card-foreground shadow-sm backdrop-blur-sm";

/** Props for the CategoryBadge component. */
interface CategoryBadgeProps {
  category: ProductCategory;
  className?: string;
}

/** Renders an ecosystem category badge with a frosted surface for readability. */
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(overlayBadgeSurfaceClassName, className)}
    >
      {ecosystemCategoryTitle(category)}
    </Badge>
  );
}

/** Props for the release date badge (YYYY-MM-DD in product metadata). */
interface ReleaseDateBadgeProps {
  isoDate: string;
  className?: string;
  showIcon?: boolean;
}

/** Renders a catalog release date badge with a frosted surface over artwork. */
export function ReleaseDateBadge({
  isoDate,
  className,
  showIcon = true,
}: ReleaseDateBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", overlayBadgeSurfaceClassName, className)}
    >
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

/** Renders "Art by <name>" with a frosted semi-opaque surface for readability over artwork. */
export function ArtistBadge({
  artist,
  className,
  showIcon = true,
}: ArtistBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", overlayBadgeSurfaceClassName, className)}
    >
      {showIcon && <Palette className="size-3" />}
      {`Art by ${artist}`}
    </Badge>
  );
}
