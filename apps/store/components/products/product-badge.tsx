/**
 * Product type badge component
 * Displays a colored badge indicating the product type (SaaS, Software, Physical)
 */

import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Cloud, Download, Package } from "lucide-react";

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
    className: string;
  }
> = {
  saas: {
    label: "SaaS",
    icon: Cloud,
    className:
      "bg-blue-600/90 text-white border-blue-500/40 dark:bg-blue-500/90",
  },
  software: {
    label: "Software",
    icon: Download,
    className:
      "bg-purple-600/90 text-white border-purple-500/40 dark:bg-purple-500/90",
  },
  physical: {
    label: "Physical",
    icon: Package,
    className:
      "bg-amber-600/90 text-white border-amber-500/40 dark:bg-amber-500/90",
  },
};

/** Renders a product type badge (software or physical). */
export function ProductBadge({
  type,
  className,
  showIcon = true,
}: ProductBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
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
    className: string;
  }
> = {
  available: {
    label: "Available",
    className:
      "bg-green-600/90 text-white border-green-500/40 dark:bg-green-500/90",
  },
  "coming-soon": {
    label: "Coming Soon",
    className:
      "bg-yellow-500/90 text-white border-yellow-400/40 dark:bg-yellow-500/90",
  },
  discontinued: {
    label: "Discontinued",
    className:
      "bg-neutral-600/90 text-white border-neutral-500/40 dark:bg-neutral-500/90",
  },
};

/** Renders a product availability status badge. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
