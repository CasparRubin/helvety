import "server-only";

import {
  serverEnvSchema,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";
import { z } from "zod";

const storeEnvSchema = serverEnvSchema.merge(upstashEnvSchema).merge(
  z.object({
    STRIPE_SECRET_KEY: z
      .string()
      .min(30, "STRIPE_SECRET_KEY is too short")
      .refine(
        (k) => k.startsWith("sk_test_") || k.startsWith("sk_live_"),
        "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_"
      ),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .min(20, "STRIPE_WEBHOOK_SECRET is too short")
      .refine(
        (k) => k.startsWith("whsec_"),
        "STRIPE_WEBHOOK_SECRET must start with whsec_"
      ),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),
  })
);

let validated: z.infer<typeof storeEnvSchema> | null = null;

/**
 * Validates all store-specific env vars on first call, then caches the result.
 * Throws with a descriptive message on missing or malformed values.
 */
export function getValidatedStoreEnv(): z.infer<typeof storeEnvSchema> {
  if (validated) return validated;

  const raw = {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  };

  const result = storeEnvSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `[store] Invalid environment variables:\n${errors}\n\nSee apps/store/env.template for required values.`
    );
  }

  validated = result.data;
  return validated;
}
