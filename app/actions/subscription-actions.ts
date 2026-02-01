"use server";

/**
 * Server actions for subscription checking
 * Query user subscriptions from the shared Supabase database
 */

import { logger } from "@/lib/logger";
import { createServerComponentClient } from "@/lib/supabase/client-factory";
import {
  HELVETY_PDF_PRODUCT_ID,
  getTierFromId,
  TIER_LIMITS,
  type SubscriptionTier,
  type TierLimits,
} from "@/lib/types/subscription";

import type { ActionResponse, SubscriptionStatus } from "@/lib/types/entities";

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Check if user has an active subscription for Helvety PDF
 */
export async function hasActiveSubscription(): Promise<
  ActionResponse<boolean>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: false };
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", HELVETY_PDF_PRODUCT_ID)
      .in("status", ["active", "trialing"])
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logger.error("Error checking subscription:", error);
      return { success: false, error: "Failed to check subscription" };
    }

    // Check if subscription exists and is not expired
    const isActive =
      data !== null &&
      (!data.current_period_end ||
        new Date(data.current_period_end) > new Date());

    return { success: true, data: isActive };
  } catch (error) {
    logger.error("Error in hasActiveSubscription:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get user's current tier for Helvety PDF
 */
export async function getUserTier(): Promise<
  ActionResponse<{
    tier: SubscriptionTier;
    limits: TierLimits;
    tierId: string | null;
    status: SubscriptionStatus | null;
    currentPeriodEnd: string | null;
  }>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - return free tier
      return {
        success: true,
        data: {
          tier: "free",
          limits: TIER_LIMITS.free,
          tierId: null,
          status: null,
          currentPeriodEnd: null,
        },
      };
    }

    // Get active subscription for Helvety PDF
    const { data, error } = await supabase
      .from("subscriptions")
      .select("tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", HELVETY_PDF_PRODUCT_ID)
      .in("status", ["active", "trialing"])
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error getting user tier:", error);
      return { success: false, error: "Failed to get subscription tier" };
    }

    // No active subscription - return free tier
    if (!data) {
      return {
        success: true,
        data: {
          tier: "free",
          limits: TIER_LIMITS.free,
          tierId: null,
          status: null,
          currentPeriodEnd: null,
        },
      };
    }

    // Check if not expired
    if (
      data.current_period_end &&
      new Date(data.current_period_end) <= new Date()
    ) {
      return {
        success: true,
        data: {
          tier: "free",
          limits: TIER_LIMITS.free,
          tierId: data.tier_id,
          status: data.status as SubscriptionStatus,
          currentPeriodEnd: data.current_period_end,
        },
      };
    }

    const tier = getTierFromId(data.tier_id);

    return {
      success: true,
      data: {
        tier,
        limits: TIER_LIMITS[tier],
        tierId: data.tier_id,
        status: data.status as SubscriptionStatus,
        currentPeriodEnd: data.current_period_end,
      },
    };
  } catch (error) {
    logger.error("Error in getUserTier:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<
  ActionResponse<{
    id: string;
  } | null>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.error("Error getting current user:", error);
      return { success: false, error: "Failed to get user" };
    }

    if (!user) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: user.id,
      },
    };
  } catch (error) {
    logger.error("Error in getCurrentUser:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
