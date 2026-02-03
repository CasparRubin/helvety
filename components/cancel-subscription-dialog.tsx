"use client";

/**
 * Cancel subscription confirmation dialog
 * Shows subscription details and confirms cancellation
 */

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  cancelSubscription,
  getSubscriptionPeriodEnd,
} from "@/app/actions/subscription-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOAST_DURATIONS } from "@/lib/constants";
import { getProductById } from "@/lib/data/products";
import { logger } from "@/lib/logger";

import type { Subscription } from "@/lib/types/entities";

/**
 *
 */
interface CancelSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Format date for display
 * @param dateString
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 *
 * @param root0
 * @param root0.subscription
 * @param root0.open
 * @param root0.onOpenChange
 * @param root0.onSuccess
 */
export function CancelSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [periodEndFromStripe, setPeriodEndFromStripe] = useState<string | null>(
    null
  );

  // When dialog opens with missing period end, fetch from Stripe so we can show "access until"
  useEffect(() => {
    if (
      !open ||
      !subscription?.id ||
      subscription.current_period_end != null ||
      !subscription.stripe_subscription_id
    ) {
      setPeriodEndFromStripe(null);
      return;
    }
    let cancelled = false;
    void getSubscriptionPeriodEnd(subscription.id).then((result) => {
      if (!cancelled && result.success && result.data) {
        setPeriodEndFromStripe(result.data.current_period_end);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    subscription?.id,
    subscription?.current_period_end,
    subscription?.stripe_subscription_id,
  ]);

  if (!subscription) return null;

  const product = getProductById(subscription.product_id);
  const tier = product?.pricing.tiers.find(
    (t) => t.id === subscription.tier_id
  );
  const productName = product?.name ?? "Unknown Product";
  const tierName = tier?.name ?? "Unknown Tier";

  const displayPeriodEnd =
    subscription.current_period_end ?? periodEndFromStripe;

  const handleCancel = async () => {
    setIsLoading(true);

    try {
      const result = await cancelSubscription(subscription.id);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to cancel subscription");
      }

      toast.success("Subscription canceled", {
        description: `Your ${productName} subscription will end on ${formatDate(displayPeriodEnd)}.`,
        duration: TOAST_DURATIONS.SUCCESS,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error("Cancel subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription. Please try again.",
        { duration: TOAST_DURATIONS.ERROR }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to cancel your <strong>{productName}</strong>{" "}
            ({tierName}) subscription?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/10 p-2">
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">What happens when you cancel:</p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                <li>
                  You&apos;ll keep access until{" "}
                  <strong className="text-foreground">
                    {formatDate(displayPeriodEnd)}
                  </strong>
                </li>
                <li>No further charges will be made</li>
                <li>You can reactivate anytime before the end date</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
