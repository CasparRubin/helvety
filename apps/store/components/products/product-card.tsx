/**
 * Product card component
 * Displays a product in the catalog grid. The entire card is a single link to the
 * product detail page (/products/[slug]); no overlay or nested links.
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

/** Props for the product card */
interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Renders a product card that links to the product detail page.
 * Card and "View Details" share one link; clicking anywhere navigates to /products/[slug].
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const Icon = product.icon ? (iconMap[product.icon] ?? FileText) : FileText;
  const priceDisplay = formatStartingFrom(
    product.pricing,
    product.pricing.tiers[0]?.currency
  );
  const productHref = `/products/${product.slug}`;

  return (
    <Link
      href={productHref}
      className="block"
      aria-label={`View ${product.name} details`}
    >
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
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-medium",
              "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
              "transition-colors"
            )}
          >
            View Details
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
