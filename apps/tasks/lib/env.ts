import "server-only";

import {
  getCiPlaceholderServerUpstashEnv,
  hasRealServerUpstashEnv,
  isCiBuildPlaceholderEnvEnabled,
  readServerUpstashEnvFromProcess,
  serverEnvSchema,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const tasksEnvSchema = serverEnvSchema.merge(upstashEnvSchema);

let validated: z.infer<typeof tasksEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * of the three values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedTasksEnv(): z.infer<typeof tasksEnvSchema> {
  if (validated) return validated;

  if (isCiBuildPlaceholderEnvEnabled() && !hasRealServerUpstashEnv()) {
    validated = getCiPlaceholderServerUpstashEnv();
    return validated;
  }

  const raw = readServerUpstashEnvFromProcess();

  const result = tasksEnvSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `[tasks] Invalid environment variables:\n${errors}\n\nSee apps/tasks/env.template for required values.`
    );
  }

  validated = result.data;
  return validated;
}
