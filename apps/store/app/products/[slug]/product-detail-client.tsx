"use client";

/**
 * Product detail client component
 * Displays full product information with pricing tiers
 * Integrates with Stripe Checkout for subscription purchases
 */

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { Button } from "@helvety/ui/button";
import { Separator } from "@helvety/ui/separator";
import { ArrowLeft, Check, ExternalLink, Github, Globe } from "lucide-react";
import Link from "next/link";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { FeatureList } from "@/components/products/feature-list";
import { PricingCard } from "@/components/products/pricing-card";
import {
  ArtistBadge,
  ProductBadge,
  StatusBadge,
} from "@/components/products/product-badge";
import { getProductBySlug } from "@/lib/data/products";
import { isSaaSProduct, isSoftwareProduct } from "@/lib/types/products";

import type { Subscription } from "@/lib/types";
import type { PricingTier } from "@/lib/types/products";

const EMPTY_SUBSCRIPTIONS: Subscription[] = [];

/** Props for the product detail page client component. */
interface ProductDetailClientProps {
  slug: string;
  /** Tier IDs with Stripe checkout enabled (resolved server-side from env vars). */
  checkoutEnabledTiers: string[];
  /** Server-prefetched subscriptions (empty array for unauthenticated users). */
  initialSubscriptions?: Subscription[];
}

/** Renders the full product detail page with pricing and features. */
export function ProductDetailClient({
  slug,
  checkoutEnabledTiers,
  initialSubscriptions = EMPTY_SUBSCRIPTIONS,
}: ProductDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const product = getProductBySlug(slug);

  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const userSubscriptions = initialSubscriptions;

  // Handle checkout success/canceled state from URL params
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");

    if (checkoutStatus === "success") {
      // Show product-specific success message
      if (product?.id === "helvety-spo-explorer") {
        // SPO Explorer: Guide users to register tenants
        toast.success("Welcome to SPO Explorer!", {
          description: "Register your SharePoint tenant to get started.",
          action: {
            label: "Register Tenant",
            onClick: () => router.push("/tenants"),
          },
          duration: TOAST_DURATIONS.SUCCESS * 2, // Extra long for actionable toast
        });
      } else {
        // Default success message
        toast.success("Checkout completed", {
          description:
            "We're confirming payment and activating your access. If you do not see it shortly, refresh the page.",
          duration: TOAST_DURATIONS.SUCCESS,
        });
      }
      // Refresh server data after successful checkout
      router.refresh();
      // Clean up URL
      window.history.replaceState({}, "", `/products/${slug}`);
    } else if (checkoutStatus === "canceled") {
      toast.info("Checkout canceled", {
        description: "No payment was made. You can try again anytime.",
        duration: TOAST_DURATIONS.INFO,
      });
      // Clean up URL
      window.history.replaceState({}, "", `/products/${slug}`);
    }
  }, [searchParams, slug, product?.id, router]);
  const refreshSubscriptions = () => {
    router.refresh();
  };

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

  const freeTagline =
    product.pricing.tiers[0]?.features
      .filter((f) => f.toLowerCase().includes("free"))
      .join(" · ") || "No purchase necessary"; // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing -- empty string must trigger fallback

  const handleTierSelect = (tier: PricingTier) => {
    setSelectedTier(tier);
  };

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
          {product.artist && <ArtistBadge artist={product.artist} />}
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
                  ? "This product is currently available at no cost"
                  : "Choose the plan that works best for you"}
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
                {appUrl && (
                  <Button className="mt-6" asChild>
                    <a href={appUrl} target="_blank" rel="noopener noreferrer">
                      Go to App
                      <ExternalLink className="ml-1.5 size-4" />
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {monthlyTiers.map((tier) => {
                  const tierSubscription =
                    userSubscriptions.find(
                      (sub) =>
                        sub.tier_id === tier.id &&
                        (sub.status === "active" || sub.status === "trialing")
                    ) ?? null;

                  return (
                    <PricingCard
                      key={tier.id}
                      tier={tier}
                      selected={selectedTier?.id === tier.id}
                      onSelect={handleTierSelect}
                      productSlug={slug}
                      userSubscription={tierSubscription}
                      onReactivate={refreshSubscriptions}
                      checkoutEnabledTiers={checkoutEnabledTiers}
                    />
                  );
                })}
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
