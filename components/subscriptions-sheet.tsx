"use client";

/**
 * Subscriptions sheet component
 * Displays user's subscriptions in a slide-in panel
 * Allows cancellation and reactivation of subscriptions
 */

import {
  CreditCard,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logger } from "@/lib/logger";

import type { Subscription } from "@/lib/types/entities";

interface SubscriptionsSheetProps {
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open state change handler */
  onOpenChange?: (open: boolean) => void;
}

export function SubscriptionsSheet({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SubscriptionsSheetProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<Subscription | null>(null);

  /**
   * Fetch user subscriptions
   */
  const fetchSubscriptions = useCallback(
    async (showRefreshIndicator = false) => {
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
        toast.error("Failed to load subscriptions");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Fetch subscriptions when sheet opens
  useEffect(() => {
    if (open) {
      void fetchSubscriptions();
    }
  }, [open, fetchSubscriptions]);

  /**
   * Handle cancel subscription click
   */
  const handleCancelClick = (subscription: Subscription) => {
    setSubscriptionToCancel(subscription);
    setCancelDialogOpen(true);
  };

  /**
   * Handle reactivate subscription
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
      });

      // Refresh subscriptions
      await fetchSubscriptions(true);
    } catch (error) {
      logger.error("Reactivate subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reactivate subscription. Please try again."
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
          : "Failed to open billing portal. Please try again."
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

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              My Subscriptions
            </SheetTitle>
            <SheetDescription>
              Manage your active subscriptions and billing
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-2" />

          {/* Subscriptions list */}
          <div className="-mx-4 flex-1 overflow-y-auto px-4 py-2">
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
                  <Package className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-1 text-lg font-medium">
                  No active subscriptions
                </h3>
                <p className="text-muted-foreground max-w-[250px] text-sm">
                  Browse our products to find a subscription that fits your
                  needs.
                </p>
              </div>
            ) : (
              // Subscription cards
              <div className="space-y-4">
                {/* Refresh button */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchSubscriptions(true)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>

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
            <SheetFooter className="border-t pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenPortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-4" />
                    Manage Billing in Stripe
                  </>
                )}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

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
