/**
 * Stripe client initialization
 * Server-side only - never import this in client components
 */

import Stripe from "stripe";

import { logger } from "@/lib/logger";

/**
 * Singleton instance of the Stripe client
 */
let stripeClient: Stripe | null = null;

/**
 * Get the Stripe secret key from environment
 */
function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. " +
        "This key is required for Stripe operations. " +
        "Add it to your .env.local file."
    );
  }
  return key;
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
