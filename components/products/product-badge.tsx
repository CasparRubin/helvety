/**
 * Product type badge component
 * Displays a colored badge indicating the product type (SaaS, Software, Physical)
 */

import { Cloud, Download, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { ProductType, ProductStatus } from "@/lib/types/products";

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
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  software: {
    label: "Software",
    icon: Download,
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  physical: {
    label: "Physical",
    icon: Package,
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

export function ProductBadge({
  type,
  className,
  showIcon = true,
}: ProductBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon data-icon="inline-start" className="size-3" />}
      {config.label}
    </Badge>
  );
}

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
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  discontinued: {
    label: "Discontinued",
    className:
      "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
