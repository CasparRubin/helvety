import "server-only";

import {
  createAppServerUpstashEnv,
  serverUpstashMergedSchema,
} from "@helvety/shared/env-validation";

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export const getValidatedDocsEnv = createAppServerUpstashEnv({
  appName: "docs",
  envTemplatePath: "apps/docs/env.template",
  schema: serverUpstashMergedSchema,
});
