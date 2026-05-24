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

/** CSRF / proxy cookie signing (separate from SUPABASE_SECRET_KEY). */
export const cookieSigningEnvSchema = z.object({
  HELVETY_COOKIE_SIGNING_SECRET: z
    .string()
    .min(
      32,
      "HELVETY_COOKIE_SIGNING_SECRET must be at least 32 characters (signs CSRF cookies in the proxy; re-issues invalid/stale cookies)"
    ),
});

/** Merged schema for server-only + Upstash + cookie signing (used by app `lib/env` modules). */
export const serverUpstashMergedSchema = serverEnvSchema
  .merge(upstashEnvSchema)
  .merge(cookieSigningEnvSchema);

/** Upstash + cookie signing without `SUPABASE_SECRET_KEY` (public tools and user-scoped vault zones). */
export const upstashCookieSigningEnvSchema = upstashEnvSchema.merge(
  cookieSigningEnvSchema
);

/** Alias: user-scoped Supabase client + RLS only (no `createAdminClient`). */
export const userScopedServerEnvSchema = upstashCookieSigningEnvSchema;

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

/** Raw server + Upstash + cookie signing read from `process.env` (trimmed, may be empty). */
export function readServerUpstashEnvFromProcess(): {
  SUPABASE_SECRET_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  HELVETY_COOKIE_SIGNING_SECRET: string;
} {
  return {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
    HELVETY_COOKIE_SIGNING_SECRET:
      process.env.HELVETY_COOKIE_SIGNING_SECRET?.trim() ?? "",
  };
}

/**
 * True when server-only Supabase secret and Upstash credentials are all set.
 * Used with {@link isCiBuildPlaceholderEnvEnabled} in each app `lib/env.ts` so
 * local `ci:release` can use {@link getCiPlaceholderServerUpstashEnv} for
 * missing secrets while still validating real `.env` when the full server env set is present.
 */
export function hasRealServerUpstashEnv(): boolean {
  const r = readServerUpstashEnvFromProcess();
  return Boolean(
    r.SUPABASE_SECRET_KEY &&
    r.UPSTASH_REDIS_REST_URL &&
    r.UPSTASH_REDIS_REST_TOKEN &&
    r.HELVETY_COOKIE_SIGNING_SECRET
  );
}

/** True when HELVETY_COOKIE_SIGNING_SECRET is set (used by deprecated {@link validateCookieSigningEnv}). */
export function hasRealCookieSigningEnv(): boolean {
  return Boolean(process.env.HELVETY_COOKIE_SIGNING_SECRET?.trim());
}

/** Raw Upstash + cookie signing read from `process.env` (trimmed, may be empty). */
export function readUpstashCookieEnvFromProcess(): {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  HELVETY_COOKIE_SIGNING_SECRET: string;
} {
  return {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
    HELVETY_COOKIE_SIGNING_SECRET:
      process.env.HELVETY_COOKIE_SIGNING_SECRET?.trim() ?? "",
  };
}

/** True when Upstash REST credentials and cookie signing secret are all set. */
export function hasRealUpstashCookieEnv(): boolean {
  const r = readUpstashCookieEnvFromProcess();
  return Boolean(
    r.UPSTASH_REDIS_REST_URL &&
    r.UPSTASH_REDIS_REST_TOKEN &&
    r.HELVETY_COOKIE_SIGNING_SECRET
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
    HELVETY_COOKIE_SIGNING_SECRET:
      "ci_build_placeholder_cookie_signing_secret_not_for_production_use_!!",
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

let cachedCiPlaceholderUpstashCookie: z.infer<
  typeof upstashCookieSigningEnvSchema
> | null = null;

/** Placeholder Upstash + cookie signing env for local build smoke tests only. */
export function getCiPlaceholderUpstashCookieEnv(): z.infer<
  typeof upstashCookieSigningEnvSchema
> {
  if (cachedCiPlaceholderUpstashCookie) {
    return cachedCiPlaceholderUpstashCookie;
  }
  const raw = {
    UPSTASH_REDIS_REST_URL: "https://ci-build-placeholder.upstash.io",
    UPSTASH_REDIS_REST_TOKEN:
      "ci_build_placeholder_upstash_token_not_for_production_use_",
    HELVETY_COOKIE_SIGNING_SECRET:
      "ci_build_placeholder_cookie_signing_secret_not_for_production_use_!!",
  };
  const result = upstashCookieSigningEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Internal error: CI placeholder upstash/cookie env: ${result.error.message}`
    );
  }
  cachedCiPlaceholderUpstashCookie = result.data;
  return cachedCiPlaceholderUpstashCookie;
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

/**
 * Factory for app `lib/env.ts` modules that validate Supabase secret + Upstash + cookie signing.
 * Returns a cached getter (e.g. `getValidatedContactsEnv`).
 */
export function createAppServerUpstashEnv<
  TSchema extends z.ZodTypeAny,
>(options: {
  appName: string;
  envTemplatePath: string;
  schema: TSchema;
  readExtraFromProcess?: () => Record<string, string>;
  ciPlaceholderExtra?: Record<string, string>;
}): () => z.infer<TSchema> {
  const {
    appName,
    envTemplatePath,
    schema,
    readExtraFromProcess,
    ciPlaceholderExtra,
  } = options;

  let validated: z.infer<TSchema> | null = null;

  return function getValidatedAppEnv(): z.infer<TSchema> {
    if (validated) {
      return validated;
    }
    validated = validateServerUpstashEnv({
      appName,
      envTemplatePath,
      schema,
      readExtraFromProcess,
      ciPlaceholderExtra,
    });
    return validated;
  };
}

/** Shared parser for Upstash + cookie signing env (no admin client). */
export function validateUpstashCookieEnv<
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
    isCiBuildPlaceholderEnvEnabled() && !hasRealUpstashCookieEnv()
      ? {
          ...getCiPlaceholderUpstashCookieEnv(),
          ...(ciPlaceholderExtra ?? {}),
        }
      : {
          ...readUpstashCookieEnvFromProcess(),
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

/**
 * Factory for app `lib/env.ts` modules that validate Upstash + cookie signing
 * (public tools with auth callbacks, or user-scoped vault zones without admin client).
 */
export function createAppUpstashCookieEnv<
  TSchema extends z.ZodTypeAny,
>(options: {
  appName: string;
  envTemplatePath: string;
  schema: TSchema;
  readExtraFromProcess?: () => Record<string, string>;
  ciPlaceholderExtra?: Record<string, string>;
}): () => z.infer<TSchema> {
  const {
    appName,
    envTemplatePath,
    schema,
    readExtraFromProcess,
    ciPlaceholderExtra,
  } = options;

  let validated: z.infer<TSchema> | null = null;

  return function getValidatedAppEnv(): z.infer<TSchema> {
    if (validated) {
      return validated;
    }
    validated = validateUpstashCookieEnv({
      appName,
      envTemplatePath,
      schema,
      readExtraFromProcess,
      ciPlaceholderExtra,
    });
    return validated;
  };
}

/** Alias for E2EE + docs zones (user-scoped Supabase client + RLS only). */
export const createAppUserScopedEnv = createAppUpstashCookieEnv;

/** Gateway zone rewrite URLs (apps/web production rewrites). */
export const WEB_GATEWAY_KEYS = [
  "AUTH_URL",
  "STORE_URL",
  "PDF_URL",
  "DOCS_URL",
  "IMAGE_UPSCALER_URL",
  "TASKS_URL",
  "CONTACTS_URL",
  "NOTES_URL",
  "LINKS_URL",
] as const;

const gatewayUrlSchema = z
  .string()
  .url()
  .refine((url) => url.startsWith("https://") || url.startsWith("http://"), {
    message: "Gateway rewrite URLs must start with http:// or https://",
  })
  .refine(
    (url) =>
      process.env.NODE_ENV !== "production" || url.startsWith("https://"),
    { message: "Gateway rewrite URLs must use HTTPS in production" }
  );

const gatewayEnvShape = Object.fromEntries(
  WEB_GATEWAY_KEYS.map((key) => [key, gatewayUrlSchema])
) as Record<(typeof WEB_GATEWAY_KEYS)[number], typeof gatewayUrlSchema>;

export const gatewayEnvSchema = z.object(gatewayEnvShape);

/** Validated gateway rewrite URL env shape for apps/web. */
type GatewayEnv = z.infer<typeof gatewayEnvSchema>;

/** Placeholder gateway rewrite URLs for local build smoke tests only. */
const CI_PLACEHOLDER_GATEWAY: GatewayEnv = {
  AUTH_URL: "https://ci-build-placeholder-auth.vercel.app",
  STORE_URL: "https://ci-build-placeholder-store.vercel.app",
  PDF_URL: "https://ci-build-placeholder-pdf.vercel.app",
  DOCS_URL: "https://ci-build-placeholder-docs.vercel.app",
  IMAGE_UPSCALER_URL: "https://ci-build-placeholder-image-upscaler.vercel.app",
  TASKS_URL: "https://ci-build-placeholder-tasks.vercel.app",
  CONTACTS_URL: "https://ci-build-placeholder-contacts.vercel.app",
  NOTES_URL: "https://ci-build-placeholder-notes.vercel.app",
  LINKS_URL: "https://ci-build-placeholder-links.vercel.app",
};

/** True when every gateway rewrite URL env var is set. */
export function hasRealGatewayEnv(): boolean {
  return WEB_GATEWAY_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

/** Reads gateway rewrite URLs from `process.env` (trimmed, may be empty). */
function readGatewayEnvFromProcess(): GatewayEnv {
  const raw = {} as Record<string, string>;
  for (const key of WEB_GATEWAY_KEYS) {
    raw[key] = process.env[key]?.trim() ?? "";
  }
  return raw as GatewayEnv;
}

/** Cached validated gateway env for apps/web instrumentation. */
let validatedGatewayEnv: GatewayEnv | null = null;

/**
 * Validates gateway rewrite URLs on first call, then caches.
 *
 * Skips strict validation in development (next.config uses localhost fallbacks).
 * On Vercel production, all zone URLs are required. With `SKIP_ENV_VALIDATION=1`
 * off Vercel, uses CI placeholders when gateway vars are missing.
 */
export function getValidatedGatewayEnv(): GatewayEnv {
  if (validatedGatewayEnv) {
    return validatedGatewayEnv;
  }

  if (process.env.NODE_ENV === "development") {
    validatedGatewayEnv = gatewayEnvSchema.parse(CI_PLACEHOLDER_GATEWAY);
    return validatedGatewayEnv;
  }

  const raw =
    isCiBuildPlaceholderEnvEnabled() && !hasRealGatewayEnv()
      ? CI_PLACEHOLDER_GATEWAY
      : readGatewayEnvFromProcess();

  const result = gatewayEnvSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[web] Invalid gateway environment variables:\n${errors}\n\nSee apps/web/env.template for required values.`
    );
  }

  if (process.env.VERCEL === "1" && !hasRealGatewayEnv()) {
    throw new Error(
      "[web] Gateway rewrite URLs are required on Vercel in production. See apps/web/env.template."
    );
  }

  validatedGatewayEnv = result.data;
  return validatedGatewayEnv;
}

/** Validates cookie signing env for legacy cookie-only tiers (deprecated). */
export function validateCookieSigningEnv(options: {
  appName: string;
  envTemplatePath: string;
}): z.infer<typeof cookieSigningEnvSchema> {
  const { appName, envTemplatePath } = options;

  const raw =
    isCiBuildPlaceholderEnvEnabled() && !hasRealCookieSigningEnv()
      ? {
          HELVETY_COOKIE_SIGNING_SECRET:
            "ci_build_placeholder_cookie_signing_secret_not_for_production_use_!!",
        }
      : {
          HELVETY_COOKIE_SIGNING_SECRET:
            process.env.HELVETY_COOKIE_SIGNING_SECRET?.trim() ?? "",
        };

  const result = cookieSigningEnvSchema.safeParse(raw);
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
      "See your app's env.template (for example apps/web/env.template) for required keys.\n\n" +
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
