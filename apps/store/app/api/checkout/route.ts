/**
 * Stripe Checkout API Route
 * Creates checkout sessions for subscription purchases.
 *
 * Security:
 * - CSRF token validation via X-CSRF-Token header
 * - Input validation with Zod schema
 * - Rate limiting to prevent abuse
 * - successUrl and cancelUrl parameters are validated to prevent open redirect attacks
 *
 * Legal: Helvety services are primarily intended for customers in Switzerland.
 * All prices are in CHF. The consent audit trail records that the customer
 * accepted the Terms of Service and Privacy Policy before purchase (supports
 * contractual evidence requirements under Swiss law).
 */

import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { urls } from "@helvety/shared/config";
import { validateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { isValidRelativePath } from "@helvety/shared/redirect-validation";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { createServerClient } from "@helvety/shared/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  stripe,
  getStripePriceId,
  CHECKOUT_CONFIG,
  getProductFromPriceId,
} from "@/lib/stripe";
import { createStripeIdempotencyKey } from "@/lib/stripe/idempotency";
import { appendQueryParam } from "@/lib/stripe/url-utils";

import type { CreateCheckoutResponse } from "@/lib/types";
import type { NextRequest } from "next/server";

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
    .regex(
      /^[a-z0-9-]+$/,
      "Tier ID must be lowercase alphanumeric with hyphens"
    ),
  successUrl: z.string().max(500).optional(),
  cancelUrl: z.string().max(500).optional(),
  // Client only attests consent was checked; server stamps authoritative audit fields.
  consentGiven: z.boolean().optional(),
});

/** Maps Stripe API errors to user-safe checkout messages. */
function getCheckoutErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeCardError) {
    return "Your card was declined. Please use a different payment method.";
  }
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return "Too many payment attempts. Please wait a moment and try again.";
  }
  if (
    error instanceof Stripe.errors.StripeInvalidRequestError ||
    error instanceof Stripe.errors.StripeAuthenticationError ||
    error instanceof Stripe.errors.StripePermissionError
  ) {
    return "We couldn't start checkout. Please try again shortly.";
  }
  if (error instanceof Stripe.errors.StripeAPIError) {
    return "Payment provider is temporarily unavailable. Please try again.";
  }
  return "An unexpected error occurred";
}

// =============================================================================
// POST /api/checkout - Create a Stripe Checkout Session
// =============================================================================

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
  const clientIP = getTrustedClientIp(request.headers, {
    requireTrustedProxyInProduction: true,
  });
  if (!clientIP) {
    return NextResponse.json(
      { error: "Unable to determine client IP" },
      { status: 400 }
    );
  }

  // Reject oversized request bodies early (100KB limit for checkout)
  const contentLength = parseInt(
    request.headers.get("content-length") ?? "0",
    10
  );
  if (contentLength > 100_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    // Rate limit by IP to prevent abuse
    const rateLimit = await checkRateLimit(
      `checkout:ip:${clientIP}`,
      RATE_LIMITS.CHECKOUT.maxRequests,
      RATE_LIMITS.CHECKOUT.windowMs
    );

    if (!rateLimit.allowed) {
      logger.warn(`Checkout rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          error: `Too many attempts. Please wait ${rateLimit.retryAfter ?? 60} seconds before trying again.`,
        },
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

    const {
      tierId,
      successUrl,
      cancelUrl,
      consentGiven = false,
    } = validationResult.data;

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
        { error: "Something went wrong. Please try again later." },
        { status: 500 }
      );
    }

    // Get current user (optional - can checkout as guest)
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let stripeCustomerId: string | undefined;
    const scopedAdmin = user ? createScopedAdminQuery(user.id) : null;
    const idempotencyWindow = Math.floor(Date.now() / (10 * 60 * 1000));
    const idempotencyScope = user?.id ?? `guest:${clientIP}`;

    // If user is logged in, get or create their Stripe customer
    if (user && scopedAdmin) {
      // Check if user has a profile with Stripe customer ID
      const { data: profile } = await scopedAdmin
        .from("user_profiles")
        .select("stripe_customer_id")
        .single();

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create(
          {
            email: user.email,
            metadata: {
              supabase_user_id: user.id,
            },
          },
          {
            idempotencyKey: createStripeIdempotencyKey(
              "checkout_customer_create",
              [idempotencyScope, user.email ?? "no-email", idempotencyWindow]
            ),
          }
        );
        stripeCustomerId = customer.id;

        // Save customer ID to profile (upsert in case profile doesn't exist)
        const { error: profileUpsertError } = await scopedAdmin
          .from("user_profiles")
          .upsert(
            {
              id: user.id,
              email: user.email!,
              stripe_customer_id: customer.id,
            },
            {
              onConflict: "id",
            }
          );
        if (profileUpsertError) {
          logger.error(
            "Failed to persist Stripe customer mapping for user profile:",
            profileUpsertError
          );
          return NextResponse.json(
            { error: "Could not prepare checkout. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    // Build success and cancel URLs
    // Security: Use trusted store URL from shared config instead of client-controlled Origin header
    const baseUrl = urls.store;
    const productSlug = productInfo.productId; // e.g., 'helvety-spo-explorer'

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

    if (!consentGiven) {
      return NextResponse.json(
        { error: "You must accept the Terms and Privacy Policy to continue." },
        { status: 400 }
      );
    }

    const consentTermsAt = new Date().toISOString();
    const consentVersion = CHECKOUT_CONFIG.consentVersion;

    // Consent audit trail is server-stamped to keep evidence trustworthy.
    metadata.consent_terms_at = consentTermsAt;
    metadata.consent_version = consentVersion;

    // Persist consent event in Supabase for audit/evidence logging (nDSG-aligned design)
    if (user && scopedAdmin) {
      try {
        await scopedAdmin.from("consent_events").insert({
          event_type: "checkout_consent",
          terms_version: consentVersion,
          privacy_version: consentVersion,
          ip_address: clientIP,
          metadata: {
            tier_id: tierId,
            product_id: productInfo.productId,
            consent_terms_at: consentTermsAt,
          },
        });
      } catch (consentError) {
        // Non-critical: Stripe metadata is the primary audit trail
        logger.warn("Could not persist consent event:", consentError);
      }
    }

    let session: Stripe.Checkout.Session;

    if (isSubscription) {
      // Subscription checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: appendQueryParam(
          resolvedSuccessUrl,
          "session_id",
          "{CHECKOUT_SESSION_ID}"
        ),
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        // tax_id_collection: Allows B2B customers to enter a VAT/UID number.
        // Helvety is not currently MWST-registered. When we register, Stripe
        // Tax will handle collection automatically.
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

      session = await stripe.checkout.sessions.create(params, {
        idempotencyKey: createStripeIdempotencyKey(
          "checkout_session_subscription",
          [
            idempotencyScope,
            tierId,
            productInfo.productId,
            resolvedSuccessUrl,
            resolvedCancelUrl,
            idempotencyWindow,
          ]
        ),
      });
    } else {
      // One-time payment checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: appendQueryParam(
          resolvedSuccessUrl,
          "session_id",
          "{CHECKOUT_SESSION_ID}"
        ),
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        // tax_id_collection: Allows B2B customers to enter a VAT/UID number.
        // Helvety is not currently MWST-registered. When we register, Stripe
        // Tax will handle collection automatically.
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

      session = await stripe.checkout.sessions.create(params, {
        idempotencyKey: createStripeIdempotencyKey("checkout_session_payment", [
          idempotencyScope,
          tierId,
          productInfo.productId,
          resolvedSuccessUrl,
          resolvedCancelUrl,
          idempotencyWindow,
        ]),
      });
    }

    if (!session.url) {
      logger.error("Stripe session created without URL");
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    logger.info(`Checkout session created: ${session.id} for tier: ${tierId}`, {
      stripe_session_id: session.id,
      tier_id: tierId,
      product_id: productInfo.productId,
      user_id: user?.id ?? null,
      is_subscription: isSubscription,
    });

    const response: CreateCheckoutResponse = {
      checkoutUrl: session.url,
      sessionId: session.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Log full error server-side only; never expose internal details to client
    logger.error("Error creating checkout session:", error);

    return NextResponse.json(
      { error: getCheckoutErrorMessage(error) },
      { status: 500 }
    );
  }
}
