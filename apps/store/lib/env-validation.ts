import { logger } from "@helvety/shared/logger";
import { z } from "zod";

/**
 * Validates that a Stripe publishable key has the correct format
 * Security: Ensures the key is a publishable key (pk_*), not a secret key
 * @param key - The key to validate
 */
function validateStripePublishableKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  const trimmedKey = key.trim();

  // Must not be empty
  if (trimmedKey.length === 0) {
    return false;
  }

  // Must start with "pk_" (test or live publishable key)
  if (
    !trimmedKey.startsWith("pk_test_") &&
    !trimmedKey.startsWith("pk_live_")
  ) {
    return false;
  }

  // Should have reasonable length (typically 100+ characters)
  if (trimmedKey.length < 20) {
    return false;
  }

  return true;
}

/**
 * Stripe-specific environment variable schema
 */
const stripeEnvSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required")
    .refine((key) => validateStripePublishableKey(key), {
      message:
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key (starts with pk_test_ or pk_live_). " +
        "WARNING: Never use the secret key (sk_*) here - it should only be used server-side. " +
        "Get your publishable key from: Stripe Dashboard > Developers > API keys > Publishable key",
    }),
});

/** Validated Stripe environment variable types */
type StripeEnv = z.infer<typeof stripeEnvSchema>;

let validatedStripeEnv: StripeEnv | null = null;

/**
 * Validates and returns Stripe environment variables.
 * Throws an error if validation fails.
 *
 * Security: This function validates that only safe environment variables are used.
 * In development, it provides helpful warnings and error messages.
 */
function getValidatedStripeEnv(): StripeEnv {
  if (validatedStripeEnv) {
    return validatedStripeEnv;
  }

  const rawEnv = {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  };

  // Development: Check if variables are missing before validation
  if (process.env.NODE_ENV === "development") {
    if (!rawEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      logger.warn(
        "⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. " +
          "Please create a .env.local file with your Stripe publishable key."
      );
    }
  }

  const result = stripeEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues
      .map((err) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      })
      .join("\n");

    const errorMessage =
      `Invalid Stripe environment variables:\n${errors}\n\n` +
      "Please check your .env.local file and ensure all required variables are set.\n" +
      "See env.template for an example.\n\n" +
      "Security Note: NEXT_PUBLIC_ variables are exposed to the client. " +
      "Only use publishable keys in these variables. " +
      "Never use secret keys or other sensitive credentials.";

    throw new Error(errorMessage);
  }

  validatedStripeEnv = result.data;
  return validatedStripeEnv;
}

/**
 * Gets Stripe publishable key with validation
 * Security: Ensures the key is a publishable key (pk_*), not a secret key
 *
 * WARNING: This key will be exposed to the client. Only use the publishable key here.
 * Never use the secret key (sk_*) in NEXT_PUBLIC_ environment variables.
 */
export function getStripePublishableKey(): string {
  const env = getValidatedStripeEnv();
  const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Additional runtime check (in case validation was bypassed)
  if (!validateStripePublishableKey(key)) {
    const errorMessage =
      "SECURITY WARNING: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not appear to be a valid publishable key. " +
      "Ensure you are using the publishable key (pk_*), not the secret key (sk_*). " +
      "Secret keys should NEVER be exposed to the client.";

    logger.error(errorMessage);

    // In development, throw an error to prevent accidental deployment
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `${errorMessage}\n\n` +
          "This error is thrown in development to prevent security issues. " +
          "Please check your .env.local file and ensure you're using the correct key.\n" +
          "Get your publishable key from: Stripe Dashboard > Developers > API keys"
      );
    }
  }

  // Development warning for common mistakes
  if (process.env.NODE_ENV === "development") {
    // Check for accidental use of secret key
    if (key.startsWith("sk_")) {
      logger.error(
        "❌  CRITICAL: Your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a SECRET KEY (sk_*). " +
          "This will expose your secret key to the client! " +
          "Please use the publishable key (pk_*) instead."
      );
      throw new Error(
        "SECURITY ERROR: Secret key used as publishable key. " +
          "Replace NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY with your publishable key (pk_*)."
      );
    }
  }

  return key;
}
