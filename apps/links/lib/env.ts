import "server-only";

import {
  serverEnvSchema,
  upstashEnvSchema,
  validateServerUpstashEnv,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const linksEnvSchema = serverEnvSchema.merge(upstashEnvSchema);

let validated: z.infer<typeof linksEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * of the three values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedLinksEnv(): z.infer<typeof linksEnvSchema> {
  if (validated) return validated;
  validated = validateServerUpstashEnv({
    appName: "links",
    envTemplatePath: "apps/links/env.template",
    schema: linksEnvSchema,
  });
  return validated;
}
