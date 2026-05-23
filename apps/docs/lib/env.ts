import "server-only";

import {
  serverUpstashMergedSchema,
  validateServerUpstashEnv,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const docsEnvSchema = serverUpstashMergedSchema;

let validated: z.infer<typeof docsEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 */
export function getValidatedDocsEnv(): z.infer<typeof docsEnvSchema> {
  if (validated) return validated;
  validated = validateServerUpstashEnv({
    appName: "docs",
    envTemplatePath: "apps/docs/env.template",
    schema: docsEnvSchema,
  });
  return validated;
}
