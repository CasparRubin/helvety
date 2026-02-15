/**
 * Subscriptions API Route
 * Get user's subscription status (for use from other apps)
 */

import { logger } from "@helvety/shared/logger";
import { createServerComponentClient } from "@helvety/shared/supabase/client-factory";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type {
  UserSubscriptionSummary,
  SubscriptionStatus,
} from "@/lib/types/entities";
import type { NextRequest } from "next/server";

// =============================================================================
// GET /api/subscriptions - Get current user's subscriptions
// =============================================================================

/** Get current user's subscriptions. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit by user ID
    const rateLimit = await checkRateLimit(
      `subscriptions:user:${user.id}`,
      RATE_LIMITS.API.maxRequests,
      RATE_LIMITS.API.windowMs
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) },
        }
      );
    }

    // Optional product filter (validated to prevent injection)
    const { searchParams } = new URL(request.url);
    const rawProductId = searchParams.get("productId");
    const ProductIdSchema = z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(100);
    const productId = rawProductId
      ? ProductIdSchema.safeParse(rawProductId).success
        ? rawProductId
        : null
      : null;

    if (rawProductId && !productId) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

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
// HEAD /api/subscriptions - Quick check for specific product access
// =============================================================================

/** Quick check for specific product subscription access. */
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    // Rate limit by user ID (same as GET)
    const rateLimit = await checkRateLimit(
      `subscriptions:user:${user.id}`,
      RATE_LIMITS.API.maxRequests,
      RATE_LIMITS.API.windowMs
    );
    if (!rateLimit.allowed) {
      return new NextResponse(null, {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) },
      });
    }

    const { searchParams } = new URL(request.url);
    const rawProductIdHead = searchParams.get("productId");

    if (!rawProductIdHead) {
      return new NextResponse(null, { status: 400 });
    }

    // Validate product ID format
    const HeadProductIdSchema = z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(100);
    if (!HeadProductIdSchema.safeParse(rawProductIdHead).success) {
      return new NextResponse(null, { status: 400 });
    }
    const productId = rawProductIdHead;

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
