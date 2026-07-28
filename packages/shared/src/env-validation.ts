import { z } from "zod";

/**
 * When `SKIP_ENV_VALIDATION=1` and not on Vercel, allow CI placeholder env.
 * Used by app `lib/env.ts` factories and gateway validation for local build smoke tests.
 */
export function isCiBuildPlaceholderEnvEnabled(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "1" && process.env.VERCEL !== "1";
}

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

/** Raw Upstash credentials read from `process.env` (trimmed, may be empty). */
export function readUpstashEnvFromProcess(): {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
} {
  return {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
  };
}

/** True when Upstash REST credentials are both set. */
export function hasRealUpstashEnv(): boolean {
  const r = readUpstashEnvFromProcess();
  return Boolean(r.UPSTASH_REDIS_REST_URL && r.UPSTASH_REDIS_REST_TOKEN);
}

let cachedCiPlaceholderUpstash: z.infer<typeof upstashEnvSchema> | null = null;

/** Placeholder Upstash env for local build smoke tests only. */
export function getCiPlaceholderUpstashEnv(): z.infer<typeof upstashEnvSchema> {
  if (cachedCiPlaceholderUpstash) {
    return cachedCiPlaceholderUpstash;
  }
  const raw = {
    UPSTASH_REDIS_REST_URL: "https://ci-build-placeholder.upstash.io",
    UPSTASH_REDIS_REST_TOKEN:
      "ci_build_placeholder_upstash_token_not_for_production_use_",
  };
  const result = upstashEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Internal error: CI placeholder upstash env: ${result.error.message}`
    );
  }
  cachedCiPlaceholderUpstash = result.data;
  return cachedCiPlaceholderUpstash;
}

/** Shared parser for Upstash-only env (store download rate limiting). */
export function validateUpstashEnv<TSchema extends z.ZodTypeAny>(options: {
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
    hasRealEnv = hasRealUpstashEnv,
    getCiPlaceholderEnv = getCiPlaceholderUpstashEnv,
  } = options;

  const rawBase =
    isCiBuildPlaceholderEnvEnabled() && !hasRealEnv()
      ? {
          ...getCiPlaceholderEnv(),
          ...(ciPlaceholderExtra ?? {}),
        }
      : {
          ...readUpstashEnvFromProcess(),
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
 * Factory for app `lib/env.ts` modules that validate Upstash only
 * (e.g. store download rate limiting).
 */
export function createAppUpstashEnv<TSchema extends z.ZodTypeAny>(options: {
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
    validated = validateUpstashEnv({
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

/** Gateway zone rewrite URLs (apps/web production rewrites). */
export const WEB_GATEWAY_KEYS = [
  "STORE_URL",
  "PDF_URL",
  "IMAGE_EDITOR_URL",
  "OCR_URL",
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
  STORE_URL: "https://ci-build-placeholder-store.vercel.app",
  PDF_URL: "https://ci-build-placeholder-pdf.vercel.app",
  IMAGE_EDITOR_URL: "https://ci-build-placeholder-image-editor.vercel.app",
  OCR_URL: "https://ci-build-placeholder-ocr.vercel.app",
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
