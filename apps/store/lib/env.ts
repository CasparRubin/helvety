import "server-only";

import {
  createAppUpstashEnv,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";

/**
 * Validates Upstash env on first call, then caches.
 *
 * Required for download rate limiting.
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders when values
 * are missing. See repository root `README.md` → Automation (`ci:release`).
 */
export const getValidatedStoreEnv = createAppUpstashEnv({
  appName: "store",
  envTemplatePath: "apps/store/env.template",
  schema: upstashEnvSchema,
});
