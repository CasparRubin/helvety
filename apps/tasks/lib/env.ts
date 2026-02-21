import "server-only";

import {
  serverEnvSchema,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";

import type { z } from "zod";

const tasksEnvSchema = serverEnvSchema.merge(upstashEnvSchema);

let validated: z.infer<typeof tasksEnvSchema> | null = null;

/**
 * Validates all tasks-specific env vars on first call, then caches the result.
 * Throws with a descriptive message on missing or malformed values.
 */
export function getValidatedTasksEnv(): z.infer<typeof tasksEnvSchema> {
  if (validated) return validated;

  const raw = {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "",
    UPSTASH_REDIS_REST_TOKEN:
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "",
  };

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
