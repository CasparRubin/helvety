"use client";

/**
 * Subscription card component
 * Displays a single subscription with status indicators and action buttons
 */

import {
  Calendar,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Check,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductById } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/pricing";

import type { Subscription, SubscriptionStatus } from "@/lib/types/entities";

/**
 *
 */
interface SubscriptionCardProps {
  subscription: Subscription;
  onCancel?: (subscription: Subscription) => void;
  onReactivate?: (subscription: Subscription) => void;
  isLoading?: boolean;
}

/**
 * Get status badge variant and label
 * @param status
 * @param cancelAtPeriodEnd
 */
function getStatusInfo(
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean
): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  icon: typeof Check;
} {
  if (cancelAtPeriodEnd) {
    return { variant: "secondary", label: "Canceling", icon: Clock };
  }

  switch (status) {
    case "active":
      return { variant: "default", label: "Active", icon: Check };
    case "trialing":
      return { variant: "secondary", label: "Trial", icon: Clock };
    case "past_due":
      return { variant: "destructive", label: "Past Due", icon: AlertCircle };
    case "canceled":
      return { variant: "outline", label: "Canceled", icon: AlertCircle };
    case "unpaid":
      return { variant: "destructive", label: "Unpaid", icon: AlertCircle };
    case "paused":
      return { variant: "secondary", label: "Paused", icon: Clock };
    default:
      return { variant: "outline", label: status, icon: AlertCircle };
  }
}

/**
 * Format date for display
 * @param dateString
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 *
 * @param root0
 * @param root0.subscription
 * @param root0.onCancel
 * @param root0.onReactivate
 * @param root0.isLoading
 */
export function SubscriptionCard({
  subscription,
  onCancel,
  onReactivate,
  isLoading = false,
}: SubscriptionCardProps) {
  const product = getProductById(subscription.product_id);
  const tier = product?.pricing.tiers.find(
    (t) => t.id === subscription.tier_id
  );

  const productName = product?.name ?? "Unknown Product";
  const tierName = tier?.name ?? "Unknown Tier";
  const statusInfo = getStatusInfo(
    subscription.status,
    subscription.cancel_at_period_end
  );
  const StatusIcon = statusInfo.icon;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  const canCancel = isActive && !subscription.cancel_at_period_end;
  const canReactivate = isActive && subscription.cancel_at_period_end;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{productName}</CardTitle>
            <p className="text-muted-foreground text-sm">{tierName}</p>
          </div>
          <Badge variant={statusInfo.variant} className="shrink-0">
            <StatusIcon className="size-3" data-icon="inline-start" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Price info */}
        {tier && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">
              {formatPrice(tier.price, tier.currency, {
                showCents: tier.price % 100 !== 0,
              })}
            </span>
            {tier.interval === "monthly" && (
              <span className="text-muted-foreground text-sm">/month</span>
            )}
            {tier.interval === "yearly" && (
              <span className="text-muted-foreground text-sm">/year</span>
            )}
          </div>
        )}

        {/* Period dates */}
        <div className="space-y-1.5 text-sm">
          {subscription.current_period_end && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4 shrink-0" />
              <span>
                {subscription.cancel_at_period_end ? (
                  <>
                    Access until: {formatDate(subscription.current_period_end)}
                  </>
                ) : (
                  <>Renews: {formatDate(subscription.current_period_end)}</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Cancellation warning */}
        {subscription.cancel_at_period_end && (
          <div className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>
                Your subscription will end on{" "}
                <strong>{formatDate(subscription.current_period_end)}</strong>.
                You can reactivate it before then to keep your access.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        {canReactivate && onReactivate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onReactivate(subscription)}
            disabled={isLoading}
            className="flex-1"
          >
            <RotateCcw className="size-4" />
            Reactivate
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(subscription)}
            disabled={isLoading}
            className={cn(
              "flex-1",
              !canReactivate && "text-destructive hover:text-destructive"
            )}
          >
            Cancel
          </Button>
        )}
        {product?.links?.website && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={product.links.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              Open
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Loading skeleton for subscription card
 */
export function SubscriptionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}
