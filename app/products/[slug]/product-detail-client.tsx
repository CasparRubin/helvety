"use client";

/**
 * Product detail client component
 * Displays full product information with pricing tiers
 * Integrates with Stripe Checkout for subscription purchases
 */

import {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
  Check,
  ChevronDown,
  Info,
  Loader2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
  getUserSubscriptions,
  reactivateSubscription,
} from "@/app/actions/subscription-actions";
import { CommandBar } from "@/components/command-bar";
import { DigitalContentConsentDialog } from "@/components/digital-content-consent-dialog";
import {
  ProductBadge,
  StatusBadge,
  FeatureList,
  MediaGallery,
} from "@/components/products";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOAST_DURATIONS } from "@/lib/constants";
import { getProductBySlug } from "@/lib/data/products";
import { logger } from "@/lib/logger";
import { isSoftwareProduct } from "@/lib/types/products";
import { cn } from "@/lib/utils";

import type {
  CreateCheckoutResponse,
  Subscription,
} from "@/lib/types/entities";
import type { PricingTier } from "@/lib/types/products";

// Icon mapping for products
const iconMap: Record<string, LucideIcon> = {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
};

/**
 *
 */
interface ProductDetailClientProps {
  slug: string;
}

/**
 *
 * @param root0
 * @param root0.slug
 */
export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const product = getProductBySlug(slug);

  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>(
    []
  );

  /**
   * Fetch user subscriptions
   */
  const fetchSubscriptions = useCallback(async () => {
    try {
      const result = await getUserSubscriptions();
      if (result.success && result.data) {
        setUserSubscriptions(result.data);
      }
    } catch (error) {
      logger.error("Error fetching subscriptions:", error);
    }
  }, []);

  // Fetch subscriptions on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching on mount is a valid pattern
    void fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Handle checkout success/cancelled state from URL params
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
            onClick: () => router.push("/account?tab=tenants"),
          },
          duration: TOAST_DURATIONS.SUCCESS * 2, // Extra long for actionable toast
        });
      } else {
        // Default success message
        toast.success("Payment successful! Thank you for your purchase.", {
          description: "Your subscription is now active.",
          duration: TOAST_DURATIONS.SUCCESS,
        });
      }
      // Refresh subscriptions after successful checkout
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetching after checkout is valid
      void fetchSubscriptions();
      // Clean up URL
      window.history.replaceState({}, "", `/products/${slug}`);
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelled", {
        description: "No payment was made. You can try again anytime.",
        duration: TOAST_DURATIONS.INFO,
      });
      // Clean up URL
      window.history.replaceState({}, "", `/products/${slug}`);
    }
  }, [searchParams, slug, fetchSubscriptions, product?.id, router]);

  if (!product) {
    notFound();
  }

  const Icon = product.icon ? (iconMap[product.icon] ?? FileText) : FileText;

  // Get monthly tiers only (filter out yearly tiers)
  const monthlyTiers = product.pricing.tiers.filter(
    (tier) => tier.interval !== "yearly"
  );

  const handleTierSelect = (tier: PricingTier) => {
    setSelectedTier(tier);
  };

  return (
    <>
      <CommandBar
        variant="product-detail"
        productName={product.name}
        links={product.links}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Product Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary flex size-16 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-8" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
          </div>
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
                  <p
                    key={paragraph.slice(0, 50)}
                    className="text-muted-foreground"
                  >
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
                  Choose the plan that works best for you
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                {monthlyTiers.map((tier) => {
                  // Find subscription for this tier
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
                      onSelect={() => handleTierSelect(tier)}
                      productSlug={slug}
                      userSubscription={tierSubscription}
                      onReactivate={fetchSubscriptions}
                    />
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Sidebar - Features & Requirements */}
          <div className="space-y-6">
            <div className="bg-card sticky top-32 z-10 space-y-6 rounded-xl border p-6 shadow-sm">
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

            {/* Media (Screencaptures & Screenshots) - Collapsible */}
            {product.media &&
              ((product.media.screencaptures?.length ?? 0) > 0 ||
                (product.media.screenshots?.length ?? 0) > 0) && (
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between transition-opacity hover:opacity-80">
                      <h2 className="text-lg font-semibold">Media</h2>
                      <ChevronDown className="text-muted-foreground size-5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-4 space-y-6">
                        {/* Screencaptures */}
                        {product.media.screencaptures &&
                          product.media.screencaptures.length > 0 && (
                            <div>
                              <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                                Screencaptures
                              </h3>
                              <MediaGallery
                                items={product.media.screencaptures}
                              />
                            </div>
                          )}
                        {/* Screenshots */}
                        {product.media.screenshots &&
                          product.media.screenshots.length > 0 && (
                            <div>
                              <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                                Screenshots
                              </h3>
                              <MediaGallery items={product.media.screenshots} />
                            </div>
                          )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 *
 */
interface PricingCardProps {
  tier: PricingTier;
  selected: boolean;
  onSelect: () => void;
  productSlug: string;
  userSubscription?: Subscription | null;
  onReactivate?: () => void;
}

// Tier IDs that have Stripe checkout enabled
const CHECKOUT_ENABLED_TIERS = [
  "helvety-pdf-pro-monthly",
  "helvety-spo-explorer-basic-monthly",
  "helvety-spo-explorer-enterprise-monthly",
];

/**
 *
 * @param root0
 * @param root0.tier
 * @param root0.selected
 * @param root0.onSelect
 * @param root0.productSlug
 * @param root0.userSubscription
 * @param root0.onReactivate
 */
function PricingCard({
  tier,
  selected,
  onSelect,
  productSlug,
  userSubscription,
  onReactivate,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const isRecurring = tier.interval === "monthly" || tier.interval === "yearly";
  const intervalLabel = isRecurring
    ? "/month"
    : tier.interval === "one-time"
      ? "one-time"
      : "";
  // Check checkout eligibility based on tier ID (stable between server/client)
  const hasPaidCheckout =
    !tier.isFree && CHECKOUT_ENABLED_TIERS.includes(tier.id);

  // Subscription state checks
  const hasActiveSubscription =
    userSubscription &&
    (userSubscription.status === "active" ||
      userSubscription.status === "trialing") &&
    !userSubscription.cancel_at_period_end;
  const isPendingCancellation =
    userSubscription &&
    (userSubscription.status === "active" ||
      userSubscription.status === "trialing") &&
    userSubscription.cancel_at_period_end;

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `CHF ${(cents / 100).toFixed(2).replace(".00", "")}`;
  };

  /**
   * Handle reactivate subscription
   */
  const handleReactivate = async () => {
    if (!userSubscription) return;

    setIsReactivating(true);

    try {
      const result = await reactivateSubscription(userSubscription.id);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to reactivate subscription");
      }

      toast.success("Subscription reactivated", {
        description: "Your subscription will continue as normal.",
        duration: TOAST_DURATIONS.SUCCESS,
      });

      onReactivate?.();
    } catch (error) {
      logger.error("Reactivate subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate subscription. Please try again.",
        { duration: TOAST_DURATIONS.ERROR }
      );
    } finally {
      setIsReactivating(false);
    }
  };

  /**
   * Handle button click - shows consent dialog for digital products
   */
  const handleButtonClick = () => {
    // Handle reactivation
    if (isPendingCancellation) {
      void handleReactivate();
      return;
    }

    // Already subscribed - do nothing
    if (hasActiveSubscription) {
      return;
    }

    if (tier.isFree || !hasPaidCheckout) {
      onSelect();
      return;
    }

    // Show consent dialog for digital content purchases (EU requirement)
    setShowConsentDialog(true);
  };

  /**
   * Handle checkout for paid tiers via Stripe (called after consent)
   */
  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierId: tier.id,
          successUrl: `/products/${productSlug}?checkout=success`,
          cancelUrl: `/products/${productSlug}?checkout=cancelled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to create checkout session");
      }

      const data: CreateCheckoutResponse = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      logger.error("Checkout error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start checkout. Please try again.",
        { duration: TOAST_DURATIONS.ERROR }
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-card relative flex w-80 flex-col rounded-2xl border px-6 py-8 text-center transition-all duration-200",
        hasActiveSubscription &&
          "border-green-500 bg-green-500/5 ring-2 ring-green-500",
        isPendingCancellation &&
          "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500",
        !hasActiveSubscription &&
          !isPendingCancellation &&
          selected &&
          "border-primary ring-primary ring-2",
        !hasActiveSubscription &&
          !isPendingCancellation &&
          tier.highlighted &&
          !selected &&
          "border-primary shadow-xl",
        !hasActiveSubscription &&
          !isPendingCancellation &&
          !tier.highlighted &&
          !selected &&
          "hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {/* Current Plan badge */}
      {hasActiveSubscription && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white shadow-md">
            <Check className="size-3" />
            Current Plan
          </span>
        </div>
      )}
      {/* Canceling badge */}
      {isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow-md">
            Canceling
          </span>
        </div>
      )}
      {/* Popular badge - only show if not subscribed */}
      {tier.highlighted && !hasActiveSubscription && !isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium shadow-md">
            Popular
          </span>
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-xl font-bold">{tier.name}</h3>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight">
            {formatPrice(tier.price)}
          </span>
        </div>
        {intervalLabel && tier.price > 0 && (
          <p className="text-muted-foreground mt-1 text-sm">{intervalLabel}</p>
        )}
      </div>

      {/* Divider */}
      <Separator className="my-5" />

      {/* Features */}
      <ul className="flex-1 space-y-3 text-left">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-green-500" />
            <span className="text-sm">{feature}</span>
            {feature === "Only limited by your device" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground hover:text-foreground mt-0.5 size-4 shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-left">
                    <p className="text-sm">
                      Helvety PDF processes everything directly in your browser.
                      This means performance depends on your device&apos;s RAM
                      and CPU. The Pro plan has no artificial limits. Your
                      device&apos;s hardware capabilities will naturally
                      determine what&apos;s possible.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </li>
        ))}
      </ul>

      {/* Limits info */}
      {tier.limits && Object.keys(tier.limits).length > 0 && (
        <div className="bg-muted/50 mt-5 rounded-lg p-3 text-left">
          <ul className="text-muted-foreground space-y-1 text-xs">
            {tier.limits.maxFiles !== undefined && (
              <li>
                {tier.limits.maxFiles === -1
                  ? "✓ Unlimited files"
                  : `Up to ${tier.limits.maxFiles} files`}
              </li>
            )}
            {tier.limits.maxFileSize && (
              <li>Max file size: {tier.limits.maxFileSize}</li>
            )}
          </ul>
        </div>
      )}

      {/* CTA - Only show for paid tiers */}
      {!tier.isFree && (
        <Button
          className="mt-6 w-full"
          variant={
            hasActiveSubscription
              ? "outline"
              : isPendingCancellation
                ? "default"
                : tier.highlighted
                  ? "default"
                  : "outline"
          }
          onClick={handleButtonClick}
          disabled={
            isLoading ||
            isReactivating ||
            !hasPaidCheckout ||
            !!hasActiveSubscription
          }
        >
          {isLoading || isReactivating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {isReactivating ? "Reactivating..." : "Processing..."}
            </>
          ) : hasActiveSubscription ? (
            <>
              <Check className="mr-2 size-4" />
              Current Plan
            </>
          ) : isPendingCancellation ? (
            <>
              <RotateCcw className="mr-2 size-4" />
              Reactivate
            </>
          ) : hasPaidCheckout ? (
            "Subscribe Now"
          ) : (
            "Coming Soon"
          )}
        </Button>
      )}

      {/* EU Digital Content Consent Dialog */}
      <DigitalContentConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onConfirm={handleCheckout}
        isLoading={isLoading}
        productName={tier.name}
      />
    </div>
  );
}
