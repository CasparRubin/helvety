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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [limits, setLimits] = useState<TierLimits>(TIER_LIMITS.free);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get current user
      const userResult = await getCurrentUser();

      if (!userResult.success || !userResult.data) {
        setIsAuthenticated(false);
        setUserEmail(null);
        setTier("free");
        setLimits(TIER_LIMITS.free);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(userResult.data.email);

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
    userEmail,
    tier,
    limits,
    isPro: tier === "pro",
    refresh,
  };
}
