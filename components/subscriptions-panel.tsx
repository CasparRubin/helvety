"use client";

/**
 * Subscriptions panel component
 * Always-visible panel displaying user's subscriptions on the right side
 * Allows cancellation and reactivation of subscriptions
 */

import {
  CreditCard,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import {
  getUserSubscriptions,
  reactivateSubscription,
  getCustomerPortalUrl,
} from "@/app/actions/subscription-actions";
import { CancelSubscriptionDialog } from "@/components/cancel-subscription-dialog";
import {
  SubscriptionCard,
  SubscriptionCardSkeleton,
} from "@/components/subscription-card";
import { SubscriptionsSheet } from "@/components/subscriptions-sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOAST_DURATIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type { Subscription } from "@/lib/types/entities";

/**
 *
 */
export function SubscriptionsPanel() {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<Subscription | null>(null);

  // Mobile sheet state
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    void checkAuth();
  }, [supabase.auth]);

  /**
   * Fetch user subscriptions
   */
  const fetchSubscriptions = useCallback(
    async (showRefreshIndicator = false) => {
      if (!isAuthenticated) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await getUserSubscriptions();

        if (!result.success) {
          throw new Error(result.error ?? "Failed to fetch subscriptions");
        }

        setSubscriptions(result.data ?? []);
      } catch (error) {
        logger.error("Error fetching subscriptions:", error);
        toast.error("Failed to load subscriptions", {
          duration: TOAST_DURATIONS.ERROR,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated]
  );

  // Fetch subscriptions on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      void fetchSubscriptions();
    }
  }, [isAuthenticated, fetchSubscriptions]);

  /**
   * Handle cancel subscription click
   * @param subscription
   */
  const handleCancelClick = (subscription: Subscription) => {
    setSubscriptionToCancel(subscription);
    setCancelDialogOpen(true);
  };

  /**
   * Handle reactivate subscription
   * @param subscription
   */
  const handleReactivate = async (subscription: Subscription) => {
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

      // Refresh subscriptions
      await fetchSubscriptions(true);
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
  };

  /**
   * Handle open billing portal
   */
  const handleOpenPortal = async () => {
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
  };

  /**
   * Handle successful cancellation
   */
  const handleCancelSuccess = () => {
    void fetchSubscriptions(true);
  };

  // Filter active subscriptions (not canceled)
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "canceled" && sub.status !== "incomplete_expired"
  );

  // Check if user has any subscriptions (for portal button)
  const hasSubscriptions = subscriptions.length > 0;

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Panel - hidden on mobile */}
      <aside
        className={cn(
          "bg-background/50 sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-l backdrop-blur-sm transition-all duration-300 lg:flex",
          isCollapsed ? "w-12" : "w-[340px]"
        )}
      >
        {isCollapsed ? (
          // Collapsed state - show expand button and icon
          <>
            <div className="flex h-12 flex-col items-center justify-center border-b">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsCollapsed(false)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Expand panel</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col items-center py-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsCollapsed(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    {activeSubscriptions.length > 0 && (
                      <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                        {activeSubscriptions.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  My Subscriptions ({activeSubscriptions.length})
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        ) : (
          // Expanded state - full panel content
          <>
            {/* Header - matches command bar height (h-12) */}
            <div className="flex h-12 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-muted-foreground h-5 w-5" />
                <h2 className="font-semibold">My Subscriptions</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fetchSubscriptions(true)}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsCollapsed(true)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Collapse panel</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Subscriptions list */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                // Loading skeletons
                <div className="space-y-4">
                  <SubscriptionCardSkeleton />
                  <SubscriptionCardSkeleton />
                </div>
              ) : activeSubscriptions.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted mb-4 rounded-full p-4">
                    <Package className="text-muted-foreground h-8 w-8" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">
                    No active subscriptions
                  </h3>
                  <p className="text-muted-foreground max-w-[220px] text-sm">
                    Browse our products to find a subscription that fits your
                    needs.
                  </p>
                </div>
              ) : (
                // Subscription cards
                <div className="space-y-4">
                  {activeSubscriptions.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      onCancel={handleCancelClick}
                      onReactivate={handleReactivate}
                      isLoading={actionLoadingId === subscription.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with billing portal link */}
            {hasSubscriptions && (
              <div className="border-t p-4">
                <Button
                  variant="outline"
                  className="w-full"
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
                      Manage Billing in Stripe
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </aside>

      {/* Mobile FAB - visible only on mobile/tablet */}
      <div className="fixed right-6 bottom-6 z-50 lg:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setMobileSheetOpen(true)}
            >
              <CreditCard className="h-6 w-6" />
              {activeSubscriptions.length > 0 && (
                <span className="bg-primary-foreground text-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold">
                  {activeSubscriptions.length}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">My Subscriptions</TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile Sheet */}
      <SubscriptionsSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
      />

      {/* Cancel subscription dialog */}
      <CancelSubscriptionDialog
        subscription={subscriptionToCancel}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onSuccess={handleCancelSuccess}
      />
    </>
  );
}
