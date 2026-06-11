import { z } from "zod";

import { logger } from "./logger";

/**
 * Client-safe `NEXT_PUBLIC_*` validation for browser bundles and shared config.
 * Server `instrumentation.ts` paths use the richer factories in `env-validation.ts`.
 */

/** Rejects secret/service_role keys; accepts `sb_publishable_*` only. */
function validatePublishableKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  const trimmedKey = key.trim();
  if (trimmedKey.length < 20) {
    return false;
  }

  const lowerKey = trimmedKey.toLowerCase();
  if (
    lowerKey.startsWith("sb_secret_") ||
    lowerKey.startsWith("sb_service_role_") ||
    lowerKey.includes("service_role")
  ) {
    return false;
  }

  return trimmedKey.startsWith("sb_publishable_");
}

export const clientPublicEnvSchema = z.object({
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
    .refine((key) => validatePublishableKey(key), {
      message:
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a valid Supabase publishable key (sb_publishable_*). " +
        "Do NOT use the Supabase secret key (legacy service_role) here - it should only be used server-side and must not be exposed to the client. " +
        "Get your publishable key from: Supabase Dashboard > Project Settings > API > Publishable key",
    }),
});

/** Validated `NEXT_PUBLIC_*` env vars safe for browser bundles. */
export type ClientPublicEnv = z.infer<typeof clientPublicEnvSchema>;

const CI_PLACEHOLDER_PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: "https://ci-build-placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_ci_build_placeholder_only_not_for_any_real_environment",
} as const satisfies ClientPublicEnv;

let validatedClientEnv: ClientPublicEnv | null = null;

/** When `SKIP_ENV_VALIDATION=1` and not on Vercel, allow CI placeholder public env. */
export function isCiBuildPlaceholderEnvEnabled(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "1" && process.env.VERCEL !== "1";
}

/** Formats Zod validation issues for startup error messages. */
function formatEnvParseError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

/**
 * Validates and caches public env vars for client-side Supabase initialization.
 */
export function getValidatedClientEnv(): ClientPublicEnv {
  if (validatedClientEnv) {
    return validatedClientEnv;
  }

  const rawEnv = {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };

  if (isCiBuildPlaceholderEnvEnabled()) {
    const hasPublicSupabase =
      Boolean(rawEnv.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    if (!hasPublicSupabase) {
      const parsed = clientPublicEnvSchema.safeParse(CI_PLACEHOLDER_PUBLIC);
      if (!parsed.success) {
        throw new Error(
          `Internal error: CI placeholder public env failed schema: ${parsed.error.message}`
        );
      }
      validatedClientEnv = parsed.data;
      return validatedClientEnv;
    }
  }

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

  const result = clientPublicEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error(
      `Invalid client environment variables:\n${formatEnvParseError(result.error)}`
    );
  }

  validatedClientEnv = result.data;
  return validatedClientEnv;
}

/** Supabase project URL validated for client usage. */
export function getClientSupabaseUrl(): string {
  return getValidatedClientEnv().NEXT_PUBLIC_SUPABASE_URL;
}

/** Supabase publishable key validated for client usage. */
export function getClientSupabaseKey(): string {
  const key = getValidatedClientEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.NODE_ENV === "development") {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.startsWith("sb_secret_") ||
      lowerKey.startsWith("sb_service_role_") ||
      lowerKey.includes("service_role")
    ) {
      logger.warn(
        "⚠️  WARNING: Your NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY appears to be a secret/service key. " +
          "This key must not be exposed to the client. " +
          "Please use the publishable key (sb_publishable_*) instead."
      );
    }
  }

  return key;
}
