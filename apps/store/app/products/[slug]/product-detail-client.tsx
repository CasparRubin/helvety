"use client";

/**
 * Product detail client component
 * Displays full product information with free download/app actions
 */

import { Button } from "@helvety/ui/button";
import { Separator } from "@helvety/ui/separator";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Github,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FeatureList } from "@/components/products/feature-list";
import { ProductBadge, StatusBadge } from "@/components/products/product-badge";
import { getProductBySlug } from "@/lib/data/products";
import { isSaaSProduct, isSoftwareProduct } from "@/lib/types/products";
import { formatPriceWithInterval } from "@/lib/utils/pricing";

/** Props for the product detail page client component. */
interface ProductDetailClientProps {
  slug: string;
}

/** Renders the full product detail page with pricing and features. */
export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get monthly tiers only (filter out yearly tiers)
  const monthlyTiers = product.pricing.tiers.filter(
    (tier) => tier.interval !== "yearly"
  );

  const isEntirelyFree = product.pricing.tiers.every(
    (tier) => tier.isFree === true || tier.price === 0
  );

  const appUrl = isSaaSProduct(product)
    ? product.saas?.appUrl
    : product.links?.website;
  const packageDownloadUrl =
    product.id === "helvety-spo-explorer"
      ? "/api/packages/spo-explorer/download"
      : null;

  const freeFeatureLines =
    product.pricing.tiers[0]?.features.filter((f) =>
      f.toLowerCase().includes("free")
    ) ?? [];
  const freeTagline =
    freeFeatureLines.length > 0
      ? freeFeatureLines.join(" · ")
      : "Available at no cost";

  const hasLinks =
    Boolean(product.links?.website) || Boolean(product.links?.github);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back + Product links */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Products</span>
          </Link>
        </Button>
        {hasLinks && product.links && (
          <div className="flex items-center gap-1">
            {product.links.website && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={product.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="size-4" />
                  <span className="hidden sm:inline">Website</span>
                </a>
              </Button>
            )}
            {product.links.github && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={product.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Product Header */}
      <div className="mb-12 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <ProductBadge type={product.type} />
          {product.status !== "available" && (
            <StatusBadge status={product.status} />
          )}
        </div>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {product.shortDescription}
        </p>
      </div>

      {/* Two-column layout: Main Content + Features Sidebar */}
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Description */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">About</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {product.description.split("\n\n").map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Pricing Section */}
          <Separator />
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Pricing</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isEntirelyFree
                  ? "This product is available at no cost"
                  : "View current availability and access details"}
              </p>
            </div>
            {isEntirelyFree ? (
              <div className="bg-card flex flex-col items-center rounded-2xl border px-6 py-8 text-center">
                <span className="text-4xl font-bold tracking-tight text-green-600 dark:text-green-400">
                  Free
                </span>
                <p className="text-muted-foreground mt-2 text-sm">
                  {freeTagline}
                </p>
                {packageDownloadUrl && (
                  <Button className="mt-6" asChild>
                    <a href={packageDownloadUrl}>
                      Download `.sppkg`
                      <Download className="ml-1.5 size-4" />
                    </a>
                  </Button>
                )}
                {appUrl && (
                  <Button className="mt-3" asChild>
                    <a href={appUrl} target="_blank" rel="noopener noreferrer">
                      Go to App
                      <ExternalLink className="ml-1.5 size-4" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {monthlyTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="bg-card w-full max-w-sm rounded-xl border p-6 text-center"
                  >
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatPriceWithInterval(
                        tier.price,
                        tier.currency,
                        tier.interval
                      )}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {tier.isFree || tier.price === 0
                        ? "No payment required"
                        : "See plan details"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar - Features & Requirements */}
        <div className="space-y-6">
          <div className="bg-surface-panel sticky top-32 z-10 space-y-6 rounded-xl border p-6 shadow-sm">
            {/* Features */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Features</h2>
              <FeatureList features={product.features} />
            </section>

            {/* System Requirements */}
            {isSoftwareProduct(product) && product.software?.requirements && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Requirements</h2>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    {product.software.requirements.map((req: string) => (
                      <li key={req} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
