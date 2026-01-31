/**
 * Product card component
 * Displays a product in the catalog grid
 */

import {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatStartingFrom } from "@/lib/utils/pricing";

import { ProductBadge, StatusBadge } from "./product-badge";

import type { Product } from "@/lib/types/products";

// Icon mapping for products
const iconMap: Record<string, LucideIcon> = {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
};

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const Icon = product.icon ? (iconMap[product.icon] ?? FileText) : FileText;
  const priceDisplay = formatStartingFrom(
    product.pricing,
    product.pricing.tiers[0]?.currency
  );

  return (
    <Card
      className={cn(
        "group relative flex flex-col transition-all hover:shadow-md",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              <div className="flex items-center gap-2">
                <ProductBadge type={product.type} showIcon={false} />
                {product.status !== "available" && (
                  <StatusBadge status={product.status} />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">
          {product.shortDescription}
        </CardDescription>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium">
          {product.pricing.hasFreeTier ? (
            <span className="text-green-600 dark:text-green-400">
              Free to start
            </span>
          ) : (
            <span className="text-muted-foreground">{priceDisplay}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/products/${product.slug}`}>
            View Details
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>

      {/* Make entire card clickable */}
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${product.name} details`}
      >
        <span className="sr-only">View {product.name}</span>
      </Link>
    </Card>
  );
}
