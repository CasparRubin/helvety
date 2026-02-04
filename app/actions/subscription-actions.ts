"use server";

/**
 * Server actions for subscription management
 * Query and manage user subscriptions
 */

import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type {
  ActionResponse,
  Subscription,
  Purchase,
  UserSubscriptionSummary,
  SubscriptionStatus,
} from "@/lib/types/entities";

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * UUID validation schema for subscription IDs
 */
const UUIDSchema = z.string().uuid("Invalid subscription ID format");

/**
 * Product ID validation schema
 */
const ProductIdSchema = z
  .string()
  .min(1, "Product ID is required")
  .max(100, "Product ID too long")
  .regex(
    /^[a-z0-9-]+$/,
    "Product ID must be lowercase alphanumeric with hyphens"
  );

/** Stripe subscription shape with period fields (SDK type may omit these) */
type StripeSubWithPeriod = {
  current_period_end?: number;
  current_period_start?: number;
  items?: {
    data?: Array<{
      current_period_start?: number;
      current_period_end?: number;
    }>;
  };
};

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Get all subscriptions for the current user.
 * If current_period_end is missing in Supabase (e.g. old rows), fetches it from Stripe and backfills the DB.
 */
export async function getUserSubscriptions(): Promise<
  ActionResponse<Subscription[]>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching subscriptions:", error);
      return { success: false, error: "Failed to fetch subscriptions" };
    }

    const subscriptions = (data ?? []) as Subscription[];

    // Identify subscriptions needing period backfill from Stripe
    const subsNeedingBackfill = subscriptions.filter(
      (sub) =>
        sub.current_period_end == null && sub.stripe_subscription_id != null
    );

    // Batch fetch from Stripe in parallel (fixes N+1 query pattern)
    if (subsNeedingBackfill.length > 0) {
      const adminClient = createAdminClient();

      const stripeResults = await Promise.allSettled(
        subsNeedingBackfill.map(async (sub) => {
          const stripeSub = (await stripe.subscriptions.retrieve(
            sub.stripe_subscription_id!
          )) as StripeSubWithPeriod;

          // Period: subscription-level or first item (newer Stripe API)
          const firstItem = stripeSub.items?.data?.[0] as
            | { current_period_start?: number; current_period_end?: number }
            | undefined;
          const periodEndTs =
            stripeSub.current_period_end ?? firstItem?.current_period_end;
          const periodStartTs =
            stripeSub.current_period_start ?? firstItem?.current_period_start;

          return {
            subId: sub.id,
            periodEnd:
              periodEndTs != null
                ? new Date(periodEndTs * 1000).toISOString()
                : null,
            periodStart:
              periodStartTs != null
                ? new Date(periodStartTs * 1000).toISOString()
                : null,
          };
        })
      );

      // Process results and update subscriptions in memory + database
      for (let i = 0; i < stripeResults.length; i++) {
        const result = stripeResults[i];
        const sub = subsNeedingBackfill[i];

        // Skip if result or sub is undefined (shouldn't happen, but satisfies TypeScript)
        if (!result || !sub) continue;

        if (result.status === "fulfilled") {
          const { periodEnd, periodStart } = result.value;

          // Update in-memory subscription
          sub.current_period_end = periodEnd;
          sub.current_period_start = periodStart ?? sub.current_period_start;

          // Update database (fire and forget - don't block the response)
          adminClient
            .from("subscriptions")
            .update({
              current_period_end: periodEnd,
              ...(periodStart != null && {
                current_period_start: periodStart,
              }),
            })
            .eq("id", sub.id)
            .then(({ error }) => {
              if (error) {
                logger.warn(
                  `Could not update period for subscription ${sub.id}:`,
                  error
                );
              }
            });
        } else {
          logger.warn(
            `Could not backfill period for subscription ${sub.id} from Stripe:`,
            result.reason
          );
        }
      }
    }

    return { success: true, data: subscriptions };
  } catch (error) {
    logger.error("Error in getUserSubscriptions:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all purchases for the current user
 */
export async function getUserPurchases(): Promise<ActionResponse<Purchase[]>> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching purchases:", error);
      return { success: false, error: "Failed to fetch purchases" };
    }

    return { success: true, data: data as Purchase[] };
  } catch (error) {
    logger.error("Error in getUserPurchases:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check if user has an active subscription for a specific product
 * @param productId
 */
export async function hasActiveSubscription(
  productId: string
): Promise<ActionResponse<boolean>> {
  try {
    // Validate input
    const parseResult = ProductIdSchema.safeParse(productId);
    if (!parseResult.success) {
      return { success: false, error: "Invalid product ID" };
    }

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
      .eq("product_id", productId)
      .eq("status", "active")
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
 * Get user's subscription summary (all active subscriptions and purchases)
 */
export async function getUserSubscriptionSummary(): Promise<
  ActionResponse<UserSubscriptionSummary>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("product_id, tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"]);

    if (subError) {
      logger.error("Error fetching subscriptions:", subError);
      return { success: false, error: "Failed to fetch subscriptions" };
    }

    // Get purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from("purchases")
      .select("product_id, tier_id, created_at")
      .eq("user_id", user.id);

    if (purchaseError) {
      logger.error("Error fetching purchases:", purchaseError);
      return { success: false, error: "Failed to fetch purchases" };
    }

    const summary: UserSubscriptionSummary = {
      userId: user.id,
      activeSubscriptions: (subscriptions || []).map((sub) => ({
        productId: sub.product_id,
        tierId: sub.tier_id,
        status: sub.status as SubscriptionStatus,
        currentPeriodEnd: sub.current_period_end,
      })),
      purchases: (purchases || []).map((p) => ({
        productId: p.product_id,
        tierId: p.tier_id,
        purchasedAt: p.created_at,
      })),
    };

    return { success: true, data: summary };
  } catch (error) {
    logger.error("Error in getUserSubscriptionSummary:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Cancel a subscription at period end
 *
 * @param subscriptionId - The subscription ID to cancel
 * @param csrfToken - CSRF token for security validation
 */
export async function cancelSubscription(
  subscriptionId: string,
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    // Validate CSRF token (required)
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const parseResult = UUIDSchema.safeParse(subscriptionId);
    if (!parseResult.success) {
      return { success: false, error: "Invalid subscription ID" };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns this subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (!subscription.stripe_subscription_id) {
      return { success: false, error: "Invalid subscription" };
    }

    // Cancel in Stripe (at period end)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local record
    const adminClient = createAdminClient();
    await adminClient
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("id", subscriptionId);

    logger.info(`Subscription ${subscriptionId} scheduled for cancellation`);

    return { success: true };
  } catch (error) {
    logger.error("Error canceling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * Fetch current_period_end from Stripe for a subscription (e.g. when Supabase has null).
 * Used by the cancel dialog so "access until" always shows a date when possible.
 * @param subscriptionId - Our subscriptions.id
 */
export async function getSubscriptionPeriodEnd(
  subscriptionId: string
): Promise<ActionResponse<{ current_period_end: string | null }>> {
  try {
    // Validate input
    const parseResult = UUIDSchema.safeParse(subscriptionId);
    if (!parseResult.success) {
      return { success: false, error: "Invalid subscription ID" };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: row, error } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (error || !row?.stripe_subscription_id) {
      return { success: false, error: "Subscription not found" };
    }

    const stripeSub = (await stripe.subscriptions.retrieve(
      row.stripe_subscription_id
    )) as StripeSubWithPeriod;
    const firstItem = stripeSub.items?.data?.[0] as
      | { current_period_end?: number }
      | undefined;
    const periodEndTs =
      stripeSub.current_period_end ?? firstItem?.current_period_end;
    const current_period_end =
      periodEndTs != null ? new Date(periodEndTs * 1000).toISOString() : null;

    return { success: true, data: { current_period_end } };
  } catch (err) {
    logger.error("Error fetching subscription period from Stripe:", err);
    return { success: false, error: "Failed to load period end" };
  }
}

/**
 * Reactivate a subscription that was scheduled for cancellation
 *
 * @param subscriptionId - The subscription ID to reactivate
 * @param csrfToken - CSRF token for security validation
 */
export async function reactivateSubscription(
  subscriptionId: string,
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    // Validate CSRF token (required)
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate input
    const parseResult = UUIDSchema.safeParse(subscriptionId);
    if (!parseResult.success) {
      return { success: false, error: "Invalid subscription ID" };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user owns this subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, cancel_at_period_end")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (!subscription.stripe_subscription_id) {
      return { success: false, error: "Invalid subscription" };
    }

    if (!subscription.cancel_at_period_end) {
      return {
        success: false,
        error: "Subscription is not scheduled for cancellation",
      };
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update local record
    const adminClient = createAdminClient();
    await adminClient
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("id", subscriptionId);

    logger.info(`Subscription ${subscriptionId} reactivated`);

    return { success: true };
  } catch (error) {
    logger.error("Error reactivating subscription:", error);
    return { success: false, error: "Failed to reactivate subscription" };
  }
}

/**
 * Get Stripe Customer Portal URL for managing subscription
 *
 * @param returnUrl - Optional URL to return to after portal session (defaults to /account)
 */
export async function getCustomerPortalUrl(
  returnUrl?: string
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return { success: false, error: "No billing account found" };
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url:
        returnUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL ?? "https://store.helvety.com"}/account`,
    });

    return { success: true, data: portalSession.url };
  } catch (error) {
    logger.error("Error creating portal session:", error);
    return { success: false, error: "Failed to create billing portal session" };
  }
}
