import "server-only";

import {
  createAppUpstashCookieEnv,
  upstashCookieSigningEnvSchema,
} from "@helvety/shared/env-validation";

/**
 * Validates Upstash + cookie signing env on first call, then caches.
 *
 * Required for auth callback strict rate limiting and CSRF cookie signing.
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders when values
 * are missing. See repository root `README.md` → Automation (`ci:release`).
 */
export const getValidatedImageUpscalerEnv = createAppUpstashCookieEnv({
  appName: "image-upscaler",
  envTemplatePath: "apps/image-upscaler/env.template",
  schema: upstashCookieSigningEnvSchema,
});
