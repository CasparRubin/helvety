import { z } from "zod";

import { logger } from "./logger";

/**
 * Validates that a key is safe for NEXT_PUBLIC usage.
 * Accepts:
 * - Modern publishable keys: sb_publishable_*
 * - Legacy anon JWTs whose payload role is anon/authenticated
 *
 * Rejects known secret/service key patterns.
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

  if (trimmedKey.length < 20) {
    return false;
  }

  const lowerKey = trimmedKey.toLowerCase();
  const hasSecretPattern =
    lowerKey.startsWith("sb_secret_") ||
    lowerKey.startsWith("sb_service_role_") ||
    lowerKey.includes("service_role");
  if (hasSecretPattern) {
    return false;
  }

  // Modern publishable key format
  if (trimmedKey.startsWith("sb_publishable_")) {
    return true;
  }

  // Legacy JWT anon key format
  const jwtParts = trimmedKey.split(".");
  if (jwtParts.length !== 3) {
    return false;
  }
  if (!trimmedKey.startsWith("eyJ")) {
    return false;
  }

  try {
    const payloadPart = jwtParts[1] ?? "";
    const base64Payload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    if (typeof atob !== "function") {
      return false;
    }
    const payloadJson = atob(base64Payload);
    const payload = JSON.parse(payloadJson) as { role?: unknown };
    const role = payload.role;
    return role === "anon" || role === "authenticated";
  } catch {
    return false;
  }
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

/** Merged schema for server-only + Upstash (used by app `lib/env` modules). */
export const serverUpstashMergedSchema =
  serverEnvSchema.merge(upstashEnvSchema);

/**
 * When `SKIP_ENV_VALIDATION=1` and not on Vercel (`VERCEL=1`), apps may use
 * schema-valid placeholder values for **missing** `NEXT_PUBLIC_*` vars so
 * `next build` can run without real secrets (e.g. root `ci:release`). If both
 * public vars are already set, they are validated normally so local builds
 * still exercise real keys. Server + Upstash placeholders are gated in each
 * app `lib/env.ts` via {@link hasRealServerUpstashEnv}. Never rely on
 * placeholders when `VERCEL=1`.
 */
export function isCiBuildPlaceholderEnvEnabled(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "1" && process.env.VERCEL !== "1";
}

/** Raw server + Upstash triple read from `process.env` (trimmed, may be empty). */
export function readServerUpstashEnvFromProcess(): {
  SUPABASE_SECRET_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
} {
  return {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
  };
}

/**
 * True when server-only Supabase secret and Upstash credentials are all set.
 * Used with {@link isCiBuildPlaceholderEnvEnabled} in each app `lib/env.ts` so
 * local `ci:release` can use {@link getCiPlaceholderServerUpstashEnv} for
 * missing secrets while still validating real `.env` when the triple is present.
 */
export function hasRealServerUpstashEnv(): boolean {
  const r = readServerUpstashEnvFromProcess();
  return Boolean(
    r.SUPABASE_SECRET_KEY &&
    r.UPSTASH_REDIS_REST_URL &&
    r.UPSTASH_REDIS_REST_TOKEN
  );
}

const CI_PLACEHOLDER_PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: "https://ci-build-placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_ci_build_placeholder_only_not_for_any_real_environment",
} as const;

let cachedCiPlaceholderServerUpstash: z.infer<
  typeof serverUpstashMergedSchema
> | null = null;

/** Placeholder server + Upstash env for local build smoke tests only. */
export function getCiPlaceholderServerUpstashEnv(): z.infer<
  typeof serverUpstashMergedSchema
> {
  if (cachedCiPlaceholderServerUpstash) {
    return cachedCiPlaceholderServerUpstash;
  }
  const raw = {
    SUPABASE_SECRET_KEY:
      "ci_build_placeholder_supabase_secret_not_for_production_use_!!",
    UPSTASH_REDIS_REST_URL: "https://ci-build-placeholder.upstash.io",
    UPSTASH_REDIS_REST_TOKEN:
      "ci_build_placeholder_upstash_token_not_for_production_use_",
  };
  const result = serverUpstashMergedSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Internal error: CI placeholder server/upstash env: ${result.error.message}`
    );
  }
  cachedCiPlaceholderServerUpstash = result.data;
  return cachedCiPlaceholderServerUpstash;
}

/** Shared parser for app server env modules (Supabase secret + Upstash + optional extras). */
export function validateServerUpstashEnv<
  TSchema extends z.ZodTypeAny,
>(options: {
  appName: string;
  envTemplatePath: string;
  schema: TSchema;
  readExtraFromProcess?: () => Record<string, string>;
  ciPlaceholderExtra?: Record<string, string>;
}): z.infer<TSchema> {
  const {
    appName,
    envTemplatePath,
    schema,
    readExtraFromProcess,
    ciPlaceholderExtra,
  } = options;

  const rawBase =
    isCiBuildPlaceholderEnvEnabled() && !hasRealServerUpstashEnv()
      ? {
          ...getCiPlaceholderServerUpstashEnv(),
          ...(ciPlaceholderExtra ?? {}),
        }
      : {
          ...readServerUpstashEnvFromProcess(),
          ...(readExtraFromProcess ? readExtraFromProcess() : {}),
        };

  const result = schema.safeParse(rawBase);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[${appName}] Invalid environment variables:\n${errors}\n\nSee ${envTemplatePath} for required values.`
    );
  }

  return result.data;
}

/** Validated environment variable types */
type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/** Formats Zod env schema failures for thrown Error messages. */
function formatEnvParseError(error: z.ZodError): string {
  return error.issues
    .map((err) => {
      const path = err.path.join(".");
      return `  - ${path}: ${err.message}`;
    })
    .join("\n");
}

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

  if (isCiBuildPlaceholderEnvEnabled()) {
    const hasPublicSupabase =
      Boolean(rawEnv.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    if (!hasPublicSupabase) {
      const parsed = envSchema.safeParse(CI_PLACEHOLDER_PUBLIC);
      if (!parsed.success) {
        throw new Error(
          `Internal error: CI placeholder public env failed schema: ${parsed.error.message}`
        );
      }
      validatedEnv = parsed.data;
      return validatedEnv;
    }
    // Real NEXT_PUBLIC_* present: validate them (do not override with placeholders).
  }

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
    const errors = formatEnvParseError(result.error);

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
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.startsWith("sb_secret_") ||
      lowerKey.startsWith("sb_service_role_") ||
      lowerKey.includes("service_role")
    ) {
      logger.warn(
        "⚠️  WARNING: Your NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY appears to be a secret/service key. " +
          "This key must not be exposed to the client. " +
          "Please use the anon/publishable key instead."
      );
    }
  }

  return key;
}
