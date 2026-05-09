/**
 * Product badge components
 * Displays colored badges for product type, availability status, and artwork artist
 */

import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Calendar, Cloud, Download, Package, Palette } from "lucide-react";

import { formatStoreReleaseDate } from "@/lib/utils/format-release-date";

import type { ProductType, ProductStatus } from "@/lib/types/products";

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
    variant: "secondary" | "outline";
  }
> = {
  saas: {
    label: "Web App",
    icon: Cloud,
    variant: "secondary",
  },
  software: {
    label: "Software",
    icon: Download,
    variant: "secondary",
  },
  physical: {
    label: "Physical",
    icon: Package,
    variant: "outline",
  },
};

/** Renders a product type badge (web app, software, or physical). */
export function ProductBadge({
  type,
  className,
  showIcon = true,
}: ProductBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      {showIcon && <Icon className="size-3" />}
      {config.label}
    </Badge>
  );
}

/** Props for the product availability status badge. */
interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const statusConfig: Record<
  ProductStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  available: {
    label: "Available",
    variant: "default",
  },
  "coming-soon": {
    label: "Coming Soon",
    variant: "secondary",
  },
  discontinued: {
    label: "Discontinued",
    variant: "outline",
  },
};

/** Renders a product availability status badge. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

/** Props for the artist badge component. */
interface ArtistBadgeProps {
  artist: string;
  className?: string;
  showIcon?: boolean;
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

/** Renders a badge showing artwork credit as "Art by <name>". */
export function ArtistBadge({
  artist,
  className,
  showIcon = true,
}: ArtistBadgeProps) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      {showIcon && <Palette className="size-3" />}
      {`Art by ${artist}`}
    </Badge>
  );
}
