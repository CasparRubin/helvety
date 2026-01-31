/**
 * Stripe configuration and product mappings
 * Maps internal product/tier IDs to Stripe Price IDs
 */

// =============================================================================
// PRICE ID MAPPINGS
// =============================================================================

/**
 * Mapping of internal tier IDs to Stripe Price IDs
 * Add new products here as they are created in Stripe
 */
export const STRIPE_PRICE_IDS = {
  'helvety-pdf-pro-monthly': process.env.STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID,
  // Add more price IDs as needed:
  // 'helvety-spo-explorer-basic-monthly': process.env.STRIPE_HELVETY_SPO_EXPLORER_BASIC_MONTHLY_PRICE_ID,
  // 'helvety-spo-explorer-enterprise-monthly': process.env.STRIPE_HELVETY_SPO_EXPLORER_ENTERPRISE_MONTHLY_PRICE_ID,
} as const

/**
 * Mapping of Stripe Price IDs back to internal product/tier info
 * Used by webhooks to identify what was purchased
 */
export const PRICE_ID_TO_PRODUCT = {
  [process.env.STRIPE_HELVETY_PDF_PRO_MONTHLY_PRICE_ID ?? '']: {
    productId: 'helvety-pdf',
    tierId: 'helvety-pdf-pro-monthly',
    name: 'Helvety PDF Pro',
    type: 'subscription' as const,
  },
  // Add more mappings as needed
} as const

// =============================================================================
// CHECKOUT CONFIGURATION
// =============================================================================

/**
 * Get Stripe Price ID for a given tier
 */
export function getStripePriceId(tierId: string): string | undefined {
  return STRIPE_PRICE_IDS[tierId as keyof typeof STRIPE_PRICE_IDS]
}

/**
 * Get product info from a Stripe Price ID
 */
export function getProductFromPriceId(priceId: string) {
  return PRICE_ID_TO_PRODUCT[priceId]
}

/**
 * Check if a tier ID is a subscription (vs one-time purchase)
 */
export function isSubscriptionTier(tierId: string): boolean {
  const subscriptionTiers = ['helvety-pdf-pro-monthly']
  return subscriptionTiers.includes(tierId)
}

/**
 * Checkout session configuration
 */
export const CHECKOUT_CONFIG = {
  // URLs for checkout redirects
  successUrl: '/products/{slug}?checkout=success',
  cancelUrl: '/products/{slug}?checkout=cancelled',

  // Subscription settings
  subscriptionSettings: {
    // Allow customers to manage subscriptions
    billingPortalEnabled: true,
    // Trial period in days (0 = no trial)
    trialDays: 0,
  },

  // Payment method types to accept
  paymentMethodTypes: ['card'] as const,

  // Allowed countries for billing
  allowedCountries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'] as const,
} as const

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

/**
 * Stripe webhook events we handle
 */
export const HANDLED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
] as const

export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number]

/**
 * Check if a webhook event type is one we handle
 */
export function isHandledWebhookEvent(
  eventType: string
): eventType is HandledWebhookEvent {
  return HANDLED_WEBHOOK_EVENTS.includes(eventType as HandledWebhookEvent)
}
