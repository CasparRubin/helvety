/**
 * Stripe configuration and product mappings
 * Maps internal product/tier IDs to Stripe Price IDs
 */

import { logger } from "@/lib/logger";

// =============================================================================
// TYPES
// =============================================================================

/** Product info associated with a Stripe Price ID */
export interface ProductInfo {
  productId: string;
  tierId: string;
  name: string;
  type: "subscription";
}

// =============================================================================
// PRODUCT DEFINITIONS
// =============================================================================

/**
 * Central product/tier definitions.
 * Add new products here as they are created in Stripe.
 */
const PRODUCT_DEFINITIONS: {
  envVar: string;
  tierId: string;
  productId: string;
  name: string;
}[] = [
  {
    envVar: "STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID",
    tierId: "helvety-pdf-pro-monthly",
    productId: "helvety-pdf",
    name: "Helvety PDF Pro",
  },
  {
    envVar: "STRIPE_HELVETY_SPO_EXPLORER_SOLO_MONTHLY_PRICE_ID",
    tierId: "helvety-spo-explorer-solo-monthly",
    productId: "helvety-spo-explorer",
    name: "Helvety SPO Explorer Solo",
  },
  {
    envVar: "STRIPE_HELVETY_SPO_EXPLORER_SUPPORTED_MONTHLY_PRICE_ID",
    tierId: "helvety-spo-explorer-supported-monthly",
    productId: "helvety-spo-explorer",
    name: "Helvety SPO Explorer Supported",
  },
];

// =============================================================================
// PRICE ID MAPPINGS (built from definitions, skipping missing env vars)
// =============================================================================

/** Build tier-to-price mapping, filtering out tiers with missing env vars */
function buildStripePriceIds(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const def of PRODUCT_DEFINITIONS) {
    const priceId = process.env[def.envVar];
    if (priceId) {
      map[def.tierId] = priceId;
    } else if (process.env.NODE_ENV === "production") {
      logger.warn(`Missing Stripe env var: ${def.envVar}`);
    }
  }
  return map;
}

/** Build price-to-product reverse mapping, skipping entries with missing env vars */
function buildPriceIdToProduct(): Record<string, ProductInfo> {
  const map: Record<string, ProductInfo> = {};
  for (const def of PRODUCT_DEFINITIONS) {
    const priceId = process.env[def.envVar];
    if (priceId) {
      map[priceId] = {
        productId: def.productId,
        tierId: def.tierId,
        name: def.name,
        type: "subscription",
      };
    }
  }
  return map;
}

/**
 * Mapping of internal tier IDs to Stripe Price IDs.
 * Only contains tiers whose env vars are configured.
 */
export const STRIPE_PRICE_IDS: Record<string, string> = buildStripePriceIds();

/**
 * Mapping of Stripe Price IDs back to internal product/tier info.
 * Used by webhooks to identify what was purchased.
 * Only contains entries whose env vars are configured (no empty-string keys).
 */
export const PRICE_ID_TO_PRODUCT: Record<string, ProductInfo> =
  buildPriceIdToProduct();

/**
 * Tier IDs that have Stripe checkout enabled.
 * Only includes tiers with valid Stripe Price IDs configured.
 */
export const CHECKOUT_ENABLED_TIERS: string[] = Object.keys(STRIPE_PRICE_IDS);

// =============================================================================
// CHECKOUT CONFIGURATION
// =============================================================================

/**
 * Get Stripe Price ID for a given tier
 * @param tierId
 */
export function getStripePriceId(tierId: string): string | undefined {
  return STRIPE_PRICE_IDS[tierId];
}

/**
 * Get product info from a Stripe Price ID
 * @param priceId
 * @returns Product info or undefined if price ID is not recognized
 */
export function getProductFromPriceId(
  priceId: string
): ProductInfo | undefined {
  return PRICE_ID_TO_PRODUCT[priceId];
}

/**
 * Checkout session configuration
 */
export const CHECKOUT_CONFIG = {
  // URLs for checkout redirects
  successUrl: "/products/{slug}?checkout=success",
  cancelUrl: "/products/{slug}?checkout=cancelled",

  // Subscription settings
  subscriptionSettings: {
    // Allow customers to manage subscriptions
    billingPortalEnabled: true,
    // Trial period in days (0 = no trial)
    trialDays: 0,
  },

  // Payment method types to accept
  paymentMethodTypes: ["card"] as const,

  // Allowed countries for billing
  allowedCountries: ["CH"] as const,
} as const;

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

/**
 * Stripe webhook events we handle
 */
export const HANDLED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

/**
 * Union type of Stripe webhook events that are handled by this application.
 */
export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

/**
 * Check if a webhook event type is one we handle
 * @param eventType
 */
export function isHandledWebhookEvent(
  eventType: string
): eventType is HandledWebhookEvent {
  return HANDLED_WEBHOOK_EVENTS.includes(eventType as HandledWebhookEvent);
}
