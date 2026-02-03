"use client";

/**
 * Subscriptions tab: compact list of active subscriptions for the /subscriptions page.
 * Renders one row per subscription (product, tier, status, price, renewal date, actions).
 * SPO Explorer (SPFx) subscriptions show a link to /tenants and a Download button.
 * Cancel/Reactivate and billing portal are supported. Uses SubscriptionCard only in
 * other contexts (e.g. SubscriptionsSheet); this tab uses an inline list.
 */

import {
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Package,
  Download,
  Building2,
  Calendar,
  AlertCircle,
  RotateCcw,
  Check,
  Clock,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  getPackageDownloadUrl,
  getPackageMetadata,
} from "@/app/actions/download-actions";
import {
  getUserSubscriptions,
  reactivateSubscription,
  getCustomerPortalUrl,
} from "@/app/actions/subscription-actions";
import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TOAST_DURATIONS } from "@/lib/constants";
import { getProductById } from "@/lib/data/products";
import { logger } from "@/lib/logger";
import { formatPrice } from "@/lib/utils/pricing";

import type { Subscription, SubscriptionStatus } from "@/lib/types/entities";

/**
 * Status badge variant, label, and icon for the subscription list.
 * @param status - Stripe subscription status
 * @param cancelAtPeriodEnd - Whether the subscription is set to cancel at period end
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

/** Format ISO date string for list display (e.g. "Jan 15, 2026"). */
function formatListDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Loading skeleton for the compact subscriptions list (matches list row layout). */
function SubscriptionsListSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4"
        >
          <div className="min-w-0 flex-1 space-y-1.5 sm:flex sm:items-center sm:gap-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0" />
          </div>
          <Skeleton className="h-4 w-12 shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <div className="flex shrink-0 gap-1.5">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the subscriptions tab: compact list of active subscriptions with actions and billing portal link.
 */
export function SubscriptionsTab() {
  // Subscriptions state
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] =
    React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(
    null
  );
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Tenant count for SPO Explorer
  const [spoTenantCount, setSpoTenantCount] = React.useState(0);
  // SPO Explorer package version (resolved from storage when user has access)
  const [spoPackageVersion, setSpoPackageVersion] = React.useState<
    string | null
  >(null);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    React.useState<Subscription | null>(null);

  // Load subscriptions on mount
  React.useEffect(() => {
    void loadSubscriptions();
    void loadSpoTenantCount();
  }, []);

  // Fetch SPO Explorer package version when user has an active SPO subscription
  React.useEffect(() => {
    const hasActiveSpo = subscriptions.some(
      (sub) =>
        sub.product_id === "helvety-spo-explorer" &&
        sub.status !== "canceled" &&
        sub.status !== "incomplete_expired"
    );
    if (!hasActiveSpo) {
      setSpoPackageVersion(null);
      return;
    }
    let cancelled = false;
    void getPackageMetadata("spo-explorer").then((result) => {
      if (cancelled) return;
      if (result.success && result.data?.version) {
        setSpoPackageVersion(result.data.version);
      } else {
        setSpoPackageVersion(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subscriptions]);

  /**
   * Load user subscriptions from the API.
   * @param showRefreshIndicator - If true, show refresh spinner instead of full loading state
   */
  async function loadSubscriptions(showRefreshIndicator = false) {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoadingSubscriptions(true);
    }

    try {
      const result = await getUserSubscriptions();
      if (result.success && result.data) {
        setSubscriptions(result.data);
      }
    } catch (error) {
      logger.error("Error loading subscriptions:", error);
      toast.error("Failed to load subscriptions", {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsLoadingSubscriptions(false);
      setIsRefreshing(false);
    }
  }

  /** Load total tenant count for SPO Explorer subscriptions (shown in Tenants link). */
  async function loadSpoTenantCount() {
    try {
      const result = await getSpoExplorerSubscriptions();
      if (result.success && result.data) {
        const totalTenants = result.data.reduce(
          (sum, sub) => sum + sub.tenantCount,
          0
        );
        setSpoTenantCount(totalTenants);
      }
    } catch (error) {
      logger.error("Error loading tenant count:", error);
    }
  }

  /**
   * Reactivate a subscription that is set to cancel at period end.
   * @param subscription - The subscription to reactivate
   */
  async function handleReactivate(subscription: Subscription) {
    setActionLoadingId(subscription.id);

    try {
      const result = await reactivateSubscription(subscription.id);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to reactivate subscription");
      }

      toast.success("Subscription reactivated", {
        description: "Your subscription will continue as normal.",
        duration: TOAST_DURATIONS.SUCCESS,
      });

      await loadSubscriptions(true);
    } catch (error) {
      logger.error("Reactivate subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate subscription. Please try again.",
        { duration: TOAST_DURATIONS.ERROR }
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  /**
   * Open the cancel-subscription dialog for the given subscription.
   * @param subscription - The subscription to cancel
   */
  function handleCancelClick(subscription: Subscription) {
    setSubscriptionToCancel(subscription);
    setCancelDialogOpen(true);
  }

  /** Called after cancel dialog completes; reloads the subscriptions list. */
  function handleCancelSuccess() {
    void loadSubscriptions(true);
  }

  /** Open Stripe Customer Portal for payment methods and invoices. */
  async function handleOpenPortal() {
    setPortalLoading(true);

    try {
      const result = await getCustomerPortalUrl(window.location.href);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to open billing portal");
      }

      window.location.href = result.data;
    } catch (error) {
      logger.error("Open portal error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open billing portal. Please try again.",
        { duration: TOAST_DURATIONS.ERROR }
      );
      setPortalLoading(false);
    }
  }

  /** Start download of the SPO Explorer package (SPFx .sppkg). */
  async function handleDownload() {
    setIsDownloading(true);
    try {
      const result = await getPackageDownloadUrl("spo-explorer");

      if (result.success && result.data) {
        window.location.href = result.data.downloadUrl;
        toast.success(`Downloading ${result.data.filename}`, {
          duration: TOAST_DURATIONS.SUCCESS,
        });
      } else {
        toast.error(result.error ?? "Failed to generate download link", {
          duration: TOAST_DURATIONS.ERROR,
        });
      }
    } catch (error) {
      logger.error("Error downloading:", error);
      toast.error("Failed to download package", {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  // Filter active subscriptions
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "canceled" && sub.status !== "incomplete_expired"
  );

  const hasSubscriptions = subscriptions.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscriptions
              </CardTitle>
              <CardDescription>
                Manage your active subscriptions and billing
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadSubscriptions(true)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSubscriptions ? (
            <SubscriptionsListSkeleton />
          ) : activeSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted mb-4 rounded-full p-4">
                <Package className="text-muted-foreground h-8 w-8" />
              </div>
              <h3 className="mb-1 text-lg font-medium">
                No active subscriptions
              </h3>
              <p className="text-muted-foreground max-w-[300px] text-sm">
                Browse our products to find a subscription that fits your needs.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {activeSubscriptions.map((subscription) => {
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
                  subscription.status === "active" ||
                  subscription.status === "trialing";
                const canCancel =
                  isActive && !subscription.cancel_at_period_end;
                const canReactivate =
                  isActive && subscription.cancel_at_period_end;
                const isSpfx =
                  subscription.product_id === "helvety-spo-explorer" &&
                  isActive;

                return (
                  <div
                    key={subscription.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="leading-tight font-medium">{productName}</p>
                      <p className="text-muted-foreground text-sm">
                        {tierName}
                      </p>
                    </div>
                    {tier && (
                      <div className="text-muted-foreground shrink-0 text-sm">
                        {formatPrice(tier.price, tier.currency, {
                          showCents: tier.price % 100 !== 0,
                        })}
                        {tier.interval === "monthly" && "/mo"}
                        {tier.interval === "yearly" && "/yr"}
                      </div>
                    )}
                    <Badge
                      variant={statusInfo.variant}
                      className="shrink-0 gap-1"
                    >
                      <StatusIcon className="size-3" />
                      {statusInfo.label}
                    </Badge>
                    {subscription.current_period_end && (
                      <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm">
                        <Calendar className="size-3.5" />
                        {subscription.cancel_at_period_end
                          ? `Ends ${formatListDate(subscription.current_period_end)}`
                          : `Renews ${formatListDate(subscription.current_period_end)}`}
                      </div>
                    )}
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {isSpfx && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary h-8 gap-1.5"
                            asChild
                          >
                            <Link href="/tenants">
                              <Building2 className="size-4" />
                              Tenants
                              {spoTenantCount > 0 && ` (${spoTenantCount})`}
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="h-8 gap-1.5"
                          >
                            {isDownloading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Download className="size-4" />
                            )}
                            {spoPackageVersion
                              ? `Download v${spoPackageVersion}`
                              : "Download"}
                          </Button>
                        </>
                      )}
                      {canReactivate && (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 gap-1"
                          onClick={() => handleReactivate(subscription)}
                          disabled={actionLoadingId === subscription.id}
                        >
                          <RotateCcw className="size-4" />
                          Reactivate
                        </Button>
                      )}
                      {product?.links?.website && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1"
                          asChild
                        >
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
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8"
                          onClick={() => handleCancelClick(subscription)}
                          disabled={actionLoadingId === subscription.id}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Billing Portal Link */}
          {hasSubscriptions && (
            <>
              <Separator />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Payment Methods & Invoices</p>
                  <p className="text-muted-foreground text-sm">
                    Update payment methods, view invoices, and manage billing
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Manage Billing
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel subscription dialog */}
      <CancelSubscriptionDialog
        subscription={subscriptionToCancel}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}
