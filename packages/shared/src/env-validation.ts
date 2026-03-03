import { z } from "zod";

import { logger } from "./logger";

/**
 * Validates that a Supabase key appears to be an anon/publishable key (not Supabase secret key / legacy service_role key)
 * Security: Prevents accidentally using secret keys in client-side code
 *
 * Note: This is a best-effort check. Supabase supports multiple key formats:
 * - Legacy JWT format (starts with "eyJ")
 * - New format (starts with "sb_" or similar)
 *
 * This validation is intentionally lenient to avoid breaking valid setups while
 * still catching obvious mistakes (like empty keys or obviously wrong values).
 */
function validateAnonKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  const trimmedKey = key.trim();

  // Must not be empty
  if (trimmedKey.length === 0) {
    return false;
  }

  // Check minimum reasonable length
  // Supabase keys are typically 20+ characters (new format) or 100+ (JWT format)
  if (trimmedKey.length < 10) {
    return false; // Too short to be a valid Supabase key
  }

  // Check for known Supabase key formats
  const isNewFormat =
    trimmedKey.startsWith("sb_") || trimmedKey.startsWith("eyJ");
  const isJWTFormat =
    trimmedKey.includes(".") && trimmedKey.split(".").length >= 2;

  // Accept if it's either:
  // 1. New Supabase format (sb_*)
  // 2. JWT format (has dots and at least 2 parts)
  // 3. Or just long enough to be reasonable (lenient fallback)
  if (isNewFormat || isJWTFormat || trimmedKey.length >= 20) {
    // If it's JWT format, validate structure
    if (isJWTFormat) {
      const parts = trimmedKey.split(".");
      // Each part should be non-empty
      if (parts.some((part) => part.length === 0)) {
        return false;
      }

      // If it's JWT but doesn't start with "eyJ", warn (might be valid but unusual)
      if (!trimmedKey.startsWith("eyJ")) {
        logger.warn(
          "WARNING: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY appears to be JWT format but doesn't start with 'eyJ'. " +
            "Ensure this is the anon/public key, not the Supabase secret key (legacy service_role)."
        );
      }
    }

    return true;
  }

  // If it doesn't match any known format and is short, reject it
  return false;
}

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .refine((url) => url.startsWith("https://") || url.startsWith("http://"), {
      message: "NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://",
    })
    .refine(
      (url) =>
        process.env.NODE_ENV !== "production" || url.startsWith("https://"),
      {
        message: "NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production",
      }
    ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required")
    .refine((key) => validateAnonKey(key), {
      message:
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a valid Supabase anon/publishable key. " +
        "Do NOT use the Supabase secret key (legacy service_role) here - it should only be used server-side and must not be exposed to the client. " +
        "Get your anon/publishable key from: Supabase Dashboard > Project Settings > API > Project API keys > anon/public key or Publishable key",
    }),
});

/**
 * Server-side env schema for apps that use SUPABASE_SECRET_KEY (admin client).
 * Compose with app-specific schemas via z.object({}).merge().
 */
export const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z
    .string()
    .min(
      40,
      "SUPABASE_SECRET_KEY is too short (use the secret key from Supabase Dashboard > API)"
    ),
});

/**
 * Upstash Redis env schema for rate limiting.
 * In production with strict policy, missing values cause rate limiting to fail closed.
 * With soft policy, requests may be allowed when credentials are missing.
 */
export const upstashEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});

/** Validated environment variable types */
type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validates and returns environment variables
 * Throws an error if validation fails
 *
 * Security: This function validates the expected environment variables.
 * In development, it provides helpful warnings and error messages.
 */
function getValidatedEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const rawEnv = {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };

  // Development: Check if variables are missing before validation
  if (process.env.NODE_ENV === "development") {
    if (!rawEnv.NEXT_PUBLIC_SUPABASE_URL) {
      logger.warn(
        "⚠️  NEXT_PUBLIC_SUPABASE_URL is not set. " +
          "Please create a .env.local file with your Supabase project URL."
      );
    }
    if (!rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      logger.warn(
        "⚠️  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. " +
          "Please create a .env.local file with your Supabase publishable key."
      );
    }
  }

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues
      .map((err) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      })
      .join("\n");

    const errorMessage =
      `Invalid environment variables:\n${errors}\n\n` +
      "Please check your .env.local file and ensure all required variables are set.\n" +
      "See env.template for an example.\n\n" +
      "Security Note: NEXT_PUBLIC_ variables are exposed to the client. " +
      "Only use safe, public keys (anon/publishable keys) in these variables. " +
      "Do not use Supabase secret keys (legacy service_role keys) or other sensitive credentials.";

    throw new Error(errorMessage);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

/**
 * Gets Supabase URL with validation
 * Security: This URL is safe to expose to the client as it's a public API endpoint
 */
export function getSupabaseUrl(): string {
  const env = getValidatedEnv();
  return env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Gets Supabase publishable key with validation
 * Security: Applies best-effort checks that the key looks like an anon/publishable key (not Supabase secret key / legacy service_role key)
 *
 * WARNING: This key will be exposed to the client. Only use the anon/publishable key here.
 * Do not use the Supabase secret key (legacy service_role) in NEXT_PUBLIC_ environment variables.
 */
export function getSupabaseKey(): string {
  const env = getValidatedEnv();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Additional runtime check (in case validation was bypassed)
  if (!validateAnonKey(key)) {
    const errorMessage =
      "SECURITY WARNING: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY does not appear to be a valid anon/publishable key. " +
      "Ensure you are using the anon/public key, not the Supabase secret key (legacy service_role). " +
      "Supabase secret keys must not be exposed to the client.";

    logger.error(errorMessage);

    // In development, throw an error to prevent accidental deployment
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `${errorMessage}\n\n` +
          "This error is thrown in development to prevent security issues. " +
          "Please check your .env.local file and ensure you're using the correct key.\n" +
          "Get your anon/publishable key from: Supabase Dashboard > Project Settings > API > Project API keys"
      );
    }
  }

  // Development warning for common mistakes
  if (process.env.NODE_ENV === "development") {
    // Check for obvious secret-key patterns (legacy service_role naming may appear)
    if (key.length > 200 && key.includes("service_role")) {
      logger.warn(
        "⚠️  WARNING: Your NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY appears to contain 'service_role'. " +
          "This is likely a Supabase secret key, which must not be exposed to the client. " +
          "Please use the anon/publishable key instead."
      );
    }
  }

  return key;
}
