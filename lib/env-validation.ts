import { z } from "zod";

import { logger } from "./logger";

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_PROJECT_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_PROJECT_URL must be a valid URL")
    .refine((url) => url.startsWith("https://") || url.startsWith("http://"), {
      message:
        "NEXT_PUBLIC_SUPABASE_PROJECT_URL must start with http:// or https://",
    }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validates and returns environment variables
 * Throws an error if validation fails
 */
export function getValidatedEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const rawEnv = {
    NEXT_PUBLIC_SUPABASE_PROJECT_URL:
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL?.trim() ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };

  // Development: Check if variables are missing before validation
  if (process.env.NODE_ENV === "development") {
    if (!rawEnv.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
      logger.warn(
        "NEXT_PUBLIC_SUPABASE_PROJECT_URL is not set. " +
          "Please create a .env.local file with your Supabase project URL."
      );
    }
    if (!rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      logger.warn(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. " +
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

    throw new Error(
      `Invalid environment variables:\n${errors}\n\n` +
        "Please check your .env.local file and ensure all required variables are set."
    );
  }

  validatedEnv = result.data;
  return validatedEnv;
}

/**
 * Gets Supabase URL with validation
 */
export function getSupabaseUrl(): string {
  const env = getValidatedEnv();
  return env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
}

/**
 * Gets Supabase publishable key with validation
 */
export function getSupabaseKey(): string {
  const env = getValidatedEnv();
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
