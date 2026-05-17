import "server-only";

import {
  serverUpstashMergedSchema,
  validateServerUpstashEnv,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const notesEnvSchema = serverUpstashMergedSchema;

let validated: z.infer<typeof notesEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedNotesEnv(): z.infer<typeof notesEnvSchema> {
  if (validated) return validated;
  validated = validateServerUpstashEnv({
    appName: "notes",
    envTemplatePath: "apps/notes/env.template",
    schema: notesEnvSchema,
  });
  return validated;
}
