"use client";

/**
 * Pricing card component
 * Displays a single pricing tier with features and CTA
 * Integrates with Stripe Checkout for paid tiers
 */

import { Check, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { reactivateSubscription } from "@/app/actions/subscription-actions";
import { DigitalContentConsentDialog } from "@/components/digital-content-consent-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { formatPrice, getIntervalShortLabel } from "@/lib/utils/pricing";

import { FeatureList } from "./feature-list";

import type {
  CreateCheckoutResponse,
  Subscription,
} from "@/lib/types/entities";
import type { PricingTier } from "@/lib/types/products";

interface PricingCardProps {
  tier: PricingTier;
  className?: string;
  /** Show monthly equivalent for yearly tiers */
  showMonthlyEquivalent?: boolean;
  /** Action when CTA is clicked (overrides default checkout behavior) */
  onSelect?: (tier: PricingTier) => void;
  /** Whether the tier is currently selected */
  selected?: boolean;
  /** Custom CTA text */
  ctaText?: string;
  /** Whether the CTA should be disabled */
  disabled?: boolean;
  /** Product slug for redirect URLs */
  productSlug?: string;
  /** User's existing subscription for this tier (if any) */
  userSubscription?: Subscription | null;
  /** Callback when subscription is reactivated */
  onReactivate?: () => void;
}

// Tier IDs that have Stripe checkout enabled
const CHECKOUT_ENABLED_TIERS = [
  "helvety-pdf-pro-monthly",
  // Add more tier IDs here as they are configured in Stripe
];

export function PricingCard({
  tier,
  className,
  showMonthlyEquivalent = false,
  onSelect,
  selected = false,
  ctaText,
  disabled = false,
  productSlug,
  userSubscription,
  onReactivate,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const isRecurring = tier.interval === "monthly" || tier.interval === "yearly";
  const intervalLabel = getIntervalShortLabel(tier.interval);
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

  // Calculate monthly equivalent for yearly plans
  const monthlyEquivalent =
    showMonthlyEquivalent && tier.interval === "yearly"
      ? Math.round(tier.price / 12)
      : null;

  const getCtaText = () => {
    if (ctaText) return ctaText;
    if (hasActiveSubscription) return "Current Plan";
    if (isPendingCancellation) return "Reactivate";
    if (tier.isFree) return "Get Started";
    if (isRecurring) return "Subscribe";
    return "Buy Now";
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
      });

      onReactivate?.();
    } catch (error) {
      logger.error("Reactivate subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate subscription. Please try again."
      );
    } finally {
      setIsReactivating(false);
    }
  };

  /**
   * Handle checkout for paid tiers via Stripe
   */
  const handleCheckout = async () => {
    if (tier.isFree || !hasPaidCheckout) {
      // For free tiers or non-checkout tiers, just call onSelect
      if (onSelect) {
        onSelect(tier);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tierId: tier.id,
          successUrl: productSlug
            ? `/products/${productSlug}?checkout=success`
            : undefined,
          cancelUrl: productSlug
            ? `/products/${productSlug}?checkout=cancelled`
            : undefined,
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
          : "Failed to start checkout. Please try again."
      );
      setIsLoading(false);
    }
  };

  /**
   * Handle button click - either custom onSelect, checkout, or reactivate
   * For paid digital products, shows consent dialog first (EU consumer law requirement)
   */
  const handleClick = () => {
    if (isPendingCancellation) {
      void handleReactivate();
      return;
    }
    if (hasActiveSubscription) {
      // Already subscribed - button should be disabled anyway
      return;
    }
    if (onSelect) {
      onSelect(tier);
    } else if (hasPaidCheckout) {
      // Show consent dialog for digital content purchases (EU requirement)
      setShowConsentDialog(true);
    }
  };

  /**
   * Handle consent dialog confirmation - proceed to checkout
   */
  const handleConsentConfirm = () => {
    void handleCheckout();
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        tier.highlighted && !hasActiveSubscription && "ring-primary ring-2",
        hasActiveSubscription && "bg-green-500/5 ring-2 ring-green-500",
        isPendingCancellation && "bg-amber-500/5 ring-2 ring-amber-500",
        selected &&
          !hasActiveSubscription &&
          !isPendingCancellation &&
          "ring-primary bg-primary/5 ring-2",
        className
      )}
    >
      {/* Current Plan badge */}
      {hasActiveSubscription && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 bg-green-500 hover:bg-green-500">
            <Check className="size-3" />
            Current Plan
          </Badge>
        </div>
      )}
      {/* Canceling badge */}
      {isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="gap-1">
            Canceling
          </Badge>
        </div>
      )}
      {/* Recommended badge - only show if not subscribed */}
      {tier.highlighted && !hasActiveSubscription && !isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1">
            <Sparkles className="size-3" />
            Recommended
          </Badge>
        </div>
      )}

      <CardHeader
        className={cn(
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Boolean OR is intentional
          (tier.highlighted || hasActiveSubscription || isPendingCancellation) &&
            "pt-4"
        )}
      >
        <CardTitle className="flex items-center justify-between">
          <span>{tier.name}</span>
          {tier.isFree && (
            <Badge variant="secondary" className="ml-2">
              Free
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              {formatPrice(tier.price, tier.currency, { showCents: false })}
            </span>
            {isRecurring && intervalLabel && (
              <span className="text-muted-foreground">/{intervalLabel}</span>
            )}
          </div>
          {monthlyEquivalent && (
            <p className="text-muted-foreground text-sm">
              {formatPrice(monthlyEquivalent, tier.currency)}/month billed
              annually
            </p>
          )}
        </div>

        {/* Features */}
        <FeatureList features={tier.features} variant="compact" />
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={
            hasActiveSubscription
              ? "outline"
              : isPendingCancellation
                ? "default"
                : tier.highlighted
                  ? "default"
                  : "outline"
          }
          onClick={handleClick}
          disabled={
            disabled || isLoading || isReactivating || !!hasActiveSubscription
          }
        >
          {isLoading || isReactivating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isReactivating ? "Reactivating..." : "Processing..."}
            </>
          ) : hasActiveSubscription ? (
            <>
              <Check className="size-4" />
              Current Plan
            </>
          ) : isPendingCancellation ? (
            <>
              <RotateCcw className="size-4" />
              Reactivate
            </>
          ) : selected ? (
            <>
              <Check className="size-4" />
              Selected
            </>
          ) : (
            getCtaText()
          )}
        </Button>
      </CardFooter>

      {/* EU Digital Content Consent Dialog */}
      <DigitalContentConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onConfirm={handleConsentConfirm}
        isLoading={isLoading}
        productName={tier.name}
      />
    </Card>
  );
}

interface PricingCardsProps {
  tiers: PricingTier[];
  className?: string;
  onSelect?: (tier: PricingTier) => void;
  selectedTierId?: string;
  disabled?: boolean;
  /** Product slug for checkout redirect URLs */
  productSlug?: string;
  /** User's subscriptions (to check if already subscribed) */
  userSubscriptions?: Subscription[];
  /** Callback when a subscription is reactivated */
  onReactivate?: () => void;
}

export function PricingCards({
  tiers,
  className,
  onSelect,
  selectedTierId,
  disabled = false,
  productSlug,
  userSubscriptions = [],
  onReactivate,
}: PricingCardsProps) {
  /**
   * Find user's subscription for a specific tier
   */
  const getSubscriptionForTier = (tierId: string): Subscription | null => {
    return (
      userSubscriptions.find(
        (sub) =>
          sub.tier_id === tierId &&
          (sub.status === "active" || sub.status === "trialing")
      ) ?? null
    );
  };

  return (
    <div
      className={cn(
        "grid gap-6",
        tiers.length === 2 && "md:grid-cols-2",
        tiers.length >= 3 && "md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {tiers.map((tier) => (
        <PricingCard
          key={tier.id}
          tier={tier}
          onSelect={onSelect}
          selected={selectedTierId === tier.id}
          showMonthlyEquivalent={tier.interval === "yearly"}
          disabled={disabled}
          productSlug={productSlug}
          userSubscription={getSubscriptionForTier(tier.id)}
          onReactivate={onReactivate}
        />
      ))}
    </div>
  );
}
