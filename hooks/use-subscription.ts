"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getUserTier,
  getCurrentUser,
} from "@/app/actions/subscription-actions";
import { logger } from "@/lib/logger";
import {
  TIER_LIMITS,
  type SubscriptionTier,
  type TierLimits,
  type SubscriptionContextValue,
} from "@/lib/types/subscription";

/**
 * Hook to get the current user's subscription status and tier limits
 *
 * @returns Subscription context value with tier info and limits
 */
export function useSubscription(): SubscriptionContextValue {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [limits, setLimits] = useState<TierLimits>(TIER_LIMITS.free);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get current user
      const userResult = await getCurrentUser();

      if (!userResult.success || !userResult.data) {
        setIsAuthenticated(false);
        setTier("free");
        setLimits(TIER_LIMITS.free);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Get subscription tier
      const tierResult = await getUserTier();

      if (tierResult.success && tierResult.data) {
        setTier(tierResult.data.tier);
        setLimits(tierResult.data.limits);
      } else {
        // Default to free tier on error
        setTier("free");
        setLimits(TIER_LIMITS.free);
      }
    } catch (error) {
      logger.error("Error fetching subscription:", error);
      // Default to free tier on error
      setTier("free");
      setLimits(TIER_LIMITS.free);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    isLoading,
    isAuthenticated,
    tier,
    limits,
    isPro: tier === "pro",
    refresh,
  };
}
