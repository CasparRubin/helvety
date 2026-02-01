/**
 * Subscriptions API Route
 * Get user's subscription status (for use from other apps)
 */

import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type {
  UserSubscriptionSummary,
  SubscriptionStatus,
} from "@/lib/types/entities";
import type { NextRequest } from "next/server";

// =============================================================================
// GET /api/subscriptions - Get current user's subscriptions
// =============================================================================

/**
 *
 * @param request
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Optional product filter
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    // Get subscriptions
    let subscriptionsQuery = supabase
      .from("subscriptions")
      .select("product_id, tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"]);

    if (productId) {
      subscriptionsQuery = subscriptionsQuery.eq("product_id", productId);
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      logger.error("Error fetching subscriptions:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    // Get purchases
    let purchasesQuery = supabase
      .from("purchases")
      .select("product_id, tier_id, created_at")
      .eq("user_id", user.id);

    if (productId) {
      purchasesQuery = purchasesQuery.eq("product_id", productId);
    }

    const { data: purchases, error: purchaseError } = await purchasesQuery;

    if (purchaseError) {
      logger.error("Error fetching purchases:", purchaseError);
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      );
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

    return NextResponse.json(summary);
  } catch (error) {
    logger.error("Error in subscriptions API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/subscriptions/check - Quick check for specific product access
// =============================================================================

/**
 *
 * @param request
 */
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return new NextResponse(null, { status: 400 });
    }

    // Check for active subscription
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("status", "active")
      .limit(1)
      .single();

    if (data) {
      // Has active subscription
      return new NextResponse(null, {
        status: 200,
        headers: { "X-Has-Subscription": "true" },
      });
    }

    // Check for purchase
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .limit(1)
      .single();

    if (purchase) {
      return new NextResponse(null, {
        status: 200,
        headers: { "X-Has-Purchase": "true" },
      });
    }

    // No subscription or purchase
    return new NextResponse(null, { status: 404 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
