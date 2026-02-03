"use client";

import {
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Package,
  Download,
  Building2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { getPackageDownloadUrl } from "@/app/actions/download-actions";
import {
  getUserSubscriptions,
  reactivateSubscription,
  getCustomerPortalUrl,
} from "@/app/actions/subscription-actions";
import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import {
  SubscriptionCard,
  SubscriptionCardSkeleton,
} from "@/components/subscription-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TOAST_DURATIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { PACKAGE_CONFIG } from "@/lib/packages/config";

import type { Subscription } from "@/lib/types/entities";

/**
 *
 */
interface SubscriptionsTabProps {
  onNavigateToTenants?: () => void;
}

/**
 *
 * @param root0
 * @param root0.onNavigateToTenants
 */
export function SubscriptionsTab({
  onNavigateToTenants,
}: SubscriptionsTabProps) {
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

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    React.useState<Subscription | null>(null);

  // Load subscriptions on mount
  React.useEffect(() => {
    void loadSubscriptions();
    void loadSpoTenantCount();
  }, []);

  /**
   *
   * @param showRefreshIndicator
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

  /**
   *
   */
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
   *
   * @param subscription
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
   *
   * @param subscription
   */
  function handleCancelClick(subscription: Subscription) {
    setSubscriptionToCancel(subscription);
    setCancelDialogOpen(true);
  }

  /**
   *
   */
  function handleCancelSuccess() {
    void loadSubscriptions(true);
  }

  /**
   *
   */
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

  /**
   *
   */
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
  const spoPackageVersion = PACKAGE_CONFIG["spo-explorer"]?.version ?? "1.0.0";

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
            <div className="space-y-4">
              <SubscriptionCardSkeleton />
              <SubscriptionCardSkeleton />
            </div>
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
            <div className="space-y-4">
              {activeSubscriptions.map((subscription) => (
                <div key={subscription.id} className="space-y-3">
                  <SubscriptionCard
                    subscription={subscription}
                    onCancel={handleCancelClick}
                    onReactivate={handleReactivate}
                    isLoading={actionLoadingId === subscription.id}
                  />
                  {/* SPO Explorer specific actions */}
                  {subscription.product_id === "helvety-spo-explorer" &&
                    (subscription.status === "active" ||
                      subscription.status === "trialing") && (
                      <div className="flex flex-wrap gap-2 pl-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Download v{spoPackageVersion}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onNavigateToTenants}
                        >
                          <Building2 className="h-4 w-4" />
                          Manage Tenants ({spoTenantCount})
                        </Button>
                      </div>
                    )}
                </div>
              ))}
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
