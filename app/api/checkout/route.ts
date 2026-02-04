/**
 * Stripe Checkout API Route
 * Creates checkout sessions for subscription purchases
 *
 * Security:
 * - CSRF token validation via X-CSRF-Token header
 * - Input validation with Zod schema
 * - Rate limiting to prevent abuse
 * - successUrl and cancelUrl parameters are validated to prevent open redirect attacks
 */

import { NextResponse } from "next/server";

import { z } from "zod";

import { validateCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isValidRelativePath } from "@/lib/redirect-validation";
import {
  stripe,
  getStripePriceId,
  CHECKOUT_CONFIG,
  getProductFromPriceId,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type { CreateCheckoutResponse } from "@/lib/types/entities";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

// =============================================================================
// Input Validation Schema
// =============================================================================

/**
 * Validation schema for checkout request
 * Security: Validates tierId format and optional URL paths
 */
const CheckoutRequestSchema = z.object({
  tierId: z
    .string()
    .min(1, "Tier ID is required")
    .max(100, "Tier ID too long")
    .regex(/^[a-z0-9-]+$/, "Tier ID must be lowercase alphanumeric with hyphens"),
  successUrl: z.string().max(500).optional(),
  cancelUrl: z.string().max(500).optional(),
});

// =============================================================================
// POST /api/checkout - Create a Stripe Checkout Session
// =============================================================================

/**
 * Get client IP for rate limiting
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Create a Stripe Checkout Session
 *
 * Security:
 * - CSRF token validation via X-CSRF-Token header
 * - Input validation with Zod schema
 * - Rate limiting by IP
 *
 * @param request - The incoming request
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Rate limit by IP to prevent abuse
    const rateLimit = checkRateLimit(
      `checkout:ip:${clientIP}`,
      RATE_LIMITS.API.maxRequests,
      RATE_LIMITS.API.windowMs
    );

    if (!rateLimit.allowed) {
      logger.warn(`Checkout rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    // Validate CSRF token from header
    const csrfToken = request.headers.get("X-CSRF-Token");
    const isValidCsrf = await validateCSRFToken(csrfToken);

    if (!isValidCsrf) {
      logger.warn(`Invalid CSRF token for checkout from IP: ${clientIP}`);
      return NextResponse.json(
        { error: "Security validation failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const rawBody = await request.json();
    const validationResult = CheckoutRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      logger.warn("Invalid checkout request:", validationResult.error.format());
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const { tierId, successUrl, cancelUrl } = validationResult.data;

    // Get Stripe Price ID for the tier
    const stripePriceId = getStripePriceId(tierId);
    if (!stripePriceId) {
      logger.error(`No Stripe Price ID configured for tier: ${tierId}`);
      return NextResponse.json(
        { error: "Invalid tier ID or tier not configured for payments" },
        { status: 400 }
      );
    }

    // Get product info from price ID
    const productInfo = getProductFromPriceId(stripePriceId);
    if (!productInfo) {
      logger.error(`No product info found for price ID: ${stripePriceId}`);
      return NextResponse.json(
        { error: "Product configuration error" },
        { status: 500 }
      );
    }

    // Get current user (optional - can checkout as guest)
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let stripeCustomerId: string | undefined;

    // If user is logged in, get or create their Stripe customer
    if (user) {
      const adminClient = createAdminClient();

      // Check if user has a profile with Stripe customer ID
      const { data: profile } = await adminClient
        .from("user_profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        stripeCustomerId = customer.id;

        // Save customer ID to profile (upsert in case profile doesn't exist)
        await adminClient.from("user_profiles").upsert(
          {
            id: user.id,
            email: user.email!,
            stripe_customer_id: customer.id,
          },
          {
            onConflict: "id",
          }
        );
      }
    }

    // Build success and cancel URLs
    const baseUrl =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "https://store.helvety.com";
    const productSlug = productInfo.productId; // e.g., 'helvety-pdf'

    // Security: Validate custom URLs to prevent open redirect attacks
    // Only relative paths starting with "/" are allowed
    const validatedSuccessUrl =
      successUrl && isValidRelativePath(successUrl) ? successUrl : null;
    const validatedCancelUrl =
      cancelUrl && isValidRelativePath(cancelUrl) ? cancelUrl : null;

    const resolvedSuccessUrl = validatedSuccessUrl
      ? `${baseUrl}${validatedSuccessUrl}`
      : `${baseUrl}${CHECKOUT_CONFIG.successUrl.replace("{slug}", productSlug)}`;

    const resolvedCancelUrl = validatedCancelUrl
      ? `${baseUrl}${validatedCancelUrl}`
      : `${baseUrl}${CHECKOUT_CONFIG.cancelUrl.replace("{slug}", productSlug)}`;

    // Create checkout session based on product type
    const isSubscription = productInfo.type === "subscription";

    const metadata: Stripe.MetadataParam = {
      tier_id: tierId,
      product_id: productInfo.productId,
    };

    if (user) {
      metadata.supabase_user_id = user.id;
    }

    let session: Stripe.Checkout.Session;

    if (isSubscription) {
      // Subscription checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${resolvedSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        subscription_data: { metadata },
      };

      if (stripeCustomerId) {
        params.customer = stripeCustomerId;
        // Required for tax_id_collection with existing customers
        params.customer_update = {
          name: "auto",
          address: "auto",
        };
      } else if (user?.email) {
        params.customer_email = user.email;
      }

      session = await stripe.checkout.sessions.create(params);
    } else {
      // One-time payment checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${resolvedSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        payment_intent_data: { metadata },
      };

      if (stripeCustomerId) {
        params.customer = stripeCustomerId;
        // Required for tax_id_collection with existing customers
        params.customer_update = {
          name: "auto",
          address: "auto",
        };
      } else if (user?.email) {
        params.customer_email = user.email;
      }

      session = await stripe.checkout.sessions.create(params);
    }

    if (!session.url) {
      logger.error("Stripe session created without URL");
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    logger.info(`Checkout session created: ${session.id} for tier: ${tierId}`);

    const response: CreateCheckoutResponse = {
      checkoutUrl: session.url,
      sessionId: session.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error creating checkout session:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
