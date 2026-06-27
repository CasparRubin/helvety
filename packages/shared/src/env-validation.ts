import { z } from "zod";

import {
  getClientSupabaseKey,
  getClientSupabaseUrl,
  isCiBuildPlaceholderEnvEnabled,
} from "./client-env";

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

/** Device-trust cookie signing (weekly re-auth gate on helvety.com; separate from CSRF signing). */
export const deviceTrustEnvSchema = z.object({
  DEVICE_TRUST_COOKIE_SECRET: z
    .string()
    .min(
      32,
      "DEVICE_TRUST_COOKIE_SECRET must be at least 32 characters (signs device trust cookies for weekly re-auth on helvety.com)"
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

/** User-scoped E2EE zones that enforce weekly device trust on helvety.com. */
export const userScopedE2eeServerEnvSchema =
  upstashCookieSigningEnvSchema.merge(deviceTrustEnvSchema);

export { isCiBuildPlaceholderEnvEnabled } from "./client-env";

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

/** True when HELVETY_COOKIE_SIGNING_SECRET is set. */
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

/** True when user-scoped E2EE env includes device-trust signing secret. */
export function hasRealUserScopedE2eeEnv(): boolean {
  return (
    hasRealUpstashCookieEnv() &&
    Boolean(process.env.DEVICE_TRUST_COOKIE_SECRET?.trim())
  );
}

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

let cachedCiPlaceholderUserScopedE2ee: z.infer<
  typeof userScopedE2eeServerEnvSchema
> | null = null;

/** Placeholder user-scoped E2EE env for local build smoke tests only. */
export function getCiPlaceholderUserScopedE2eeEnv(): z.infer<
  typeof userScopedE2eeServerEnvSchema
> {
  if (cachedCiPlaceholderUserScopedE2ee) {
    return cachedCiPlaceholderUserScopedE2ee;
  }
  const raw = {
    ...getCiPlaceholderUpstashCookieEnv(),
    DEVICE_TRUST_COOKIE_SECRET:
      "ci_build_placeholder_device_trust_secret_not_for_production_use_!!",
  };
  const result = userScopedE2eeServerEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Internal error: CI placeholder user-scoped E2EE env: ${result.error.message}`
    );
  }
  cachedCiPlaceholderUserScopedE2ee = result.data;
  return cachedCiPlaceholderUserScopedE2ee;
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
  hasRealEnv?: () => boolean;
  getCiPlaceholderEnv?: () => Record<string, string>;
}): z.infer<TSchema> {
  const {
    appName,
    envTemplatePath,
    schema,
    readExtraFromProcess,
    ciPlaceholderExtra,
    hasRealEnv = hasRealUpstashCookieEnv,
    getCiPlaceholderEnv = getCiPlaceholderUpstashCookieEnv,
  } = options;

  const rawBase =
    isCiBuildPlaceholderEnvEnabled() && !hasRealEnv()
      ? {
          ...getCiPlaceholderEnv(),
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
  hasRealEnv?: () => boolean;
  getCiPlaceholderEnv?: () => Record<string, string>;
}): () => z.infer<TSchema> {
  const {
    appName,
    envTemplatePath,
    schema,
    readExtraFromProcess,
    ciPlaceholderExtra,
    hasRealEnv,
    getCiPlaceholderEnv,
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
      hasRealEnv,
      getCiPlaceholderEnv,
    });
    return validated;
  };
}

/** User-scoped E2EE zones with weekly device trust on helvety.com. */
export function createAppUserScopedE2eeEnv(options: {
  appName: string;
  envTemplatePath: string;
}): () => z.infer<typeof userScopedE2eeServerEnvSchema> {
  return createAppUpstashCookieEnv({
    ...options,
    schema: userScopedE2eeServerEnvSchema,
    readExtraFromProcess: () => ({
      DEVICE_TRUST_COOKIE_SECRET:
        process.env.DEVICE_TRUST_COOKIE_SECRET?.trim() ?? "",
    }),
    hasRealEnv: hasRealUserScopedE2eeEnv,
    getCiPlaceholderEnv: getCiPlaceholderUserScopedE2eeEnv,
  });
}

/** Gateway zone rewrite URLs (apps/web production rewrites). */
export const WEB_GATEWAY_KEYS = [
  "AUTH_URL",
  "STORE_URL",
  "PDF_URL",
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

/**
 * Gets Supabase URL with validation
 * Security: This URL is safe to expose to the client as it's a public API endpoint
 */
export function getSupabaseUrl(): string {
  return getClientSupabaseUrl();
}

/**
 * Gets Supabase publishable key with validation
 * Security: Publishable key only (`sb_publishable_*`); rejects secret/service_role patterns.
 *
 * WARNING: This key will be exposed to the client. Only use the Supabase publishable key here.
 * Do not use the Supabase secret key (legacy service_role) in NEXT_PUBLIC_ environment variables.
 */
export function getSupabaseKey(): string {
  return getClientSupabaseKey();
}
