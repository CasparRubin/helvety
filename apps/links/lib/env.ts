import "server-only";

import {
  serverUpstashMergedSchema,
  validateServerUpstashEnv,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const linksEnvSchema = serverUpstashMergedSchema;

let validated: z.infer<typeof linksEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing; otherwise validates `process.env` with Zod.
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
