/**
 * Stripe client initialization
 * Server-side only - never import this in client components
 */

import "server-only";

import Stripe from "stripe";

import { logger } from "@/lib/logger";

/**
 * Singleton instance of the Stripe client
 */
let stripeClient: Stripe | null = null;

/**
 * Validates and returns the Stripe secret key from environment
 * Security: Validates the key format to ensure it's a secret key (sk_*)
 * @throws Error if the key is missing or has an invalid format
 */
function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. " +
        "This key is required for Stripe operations. " +
        "Add it to your .env.local file. " +
        "Get your secret key from: Stripe Dashboard > Developers > API keys"
    );
  }

  // Validate key format: must start with sk_test_ or sk_live_
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error(
      "STRIPE_SECRET_KEY has an invalid format. " +
        "Secret keys must start with 'sk_test_' (test mode) or 'sk_live_' (production). " +
        "Ensure you're using the secret key, not the publishable key (pk_*). " +
        "Get your secret key from: Stripe Dashboard > Developers > API keys"
    );
  }

  // Sanity check: should be reasonably long
  if (key.length < 30) {
    throw new Error(
      "STRIPE_SECRET_KEY appears to be too short. " +
        "Ensure you've copied the complete key from Stripe Dashboard."
    );
  }

  return key;
}

/**
 * Validates and returns the Stripe webhook secret from environment
 * Security: Validates the key format to ensure it's a webhook secret (whsec_*)
 * @throws Error if the key is missing or has an invalid format
 */
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. " +
        "This secret is required to verify webhook signatures from Stripe. " +
        "Add it to your .env.local file. " +
        "Get your webhook secret from: Stripe Dashboard > Developers > Webhooks > Select endpoint > Signing secret"
    );
  }

  // Validate secret format: must start with whsec_
  if (!secret.startsWith("whsec_")) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET has an invalid format. " +
        "Webhook secrets must start with 'whsec_'. " +
        "Get your webhook secret from: Stripe Dashboard > Developers > Webhooks > Select endpoint > Signing secret"
    );
  }

  // Sanity check: should be reasonably long
  if (secret.length < 20) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET appears to be too short. " +
        "Ensure you've copied the complete secret from Stripe Dashboard."
    );
  }

  return secret;
}

/**
 * Get or create the Stripe client instance
 * Uses lazy initialization to avoid build-time errors
 */
export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = getStripeSecretKey();

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
    appInfo: {
      name: "helvety-store",
      version: "1.0.0",
      url: "https://store.helvety.com",
    },
  });

  return stripeClient;
}

/**
 * Server-side Stripe client getter
 * Use this instead of importing stripe directly
 */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripeClient()[prop as keyof Stripe];
  },
});

/**
 * Verify that Stripe is properly configured
 * Call this in development to ensure keys are set
 */
export async function verifyStripeConfig(): Promise<boolean> {
  try {
    const client = getStripeClient();
    // Make a simple API call to verify the key works
    await client.customers.list({ limit: 1 });
    return true;
  } catch (error) {
    logger.error("Stripe configuration verification failed:", error);
    return false;
  }
}
