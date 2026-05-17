import "server-only";

import {
  serverUpstashMergedSchema,
  validateServerUpstashEnv,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const tasksEnvSchema = serverUpstashMergedSchema;

let validated: z.infer<typeof tasksEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedTasksEnv(): z.infer<typeof tasksEnvSchema> {
  if (validated) return validated;
  validated = validateServerUpstashEnv({
    appName: "tasks",
    envTemplatePath: "apps/tasks/env.template",
    schema: tasksEnvSchema,
  });
  return validated;
}
