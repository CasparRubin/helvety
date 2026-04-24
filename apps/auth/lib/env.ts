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

const authEnvSchema = serverEnvSchema.merge(upstashEnvSchema);

let validated: z.infer<typeof authEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * of the three values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedAuthEnv(): z.infer<typeof authEnvSchema> {
  if (validated) return validated;

  if (isCiBuildPlaceholderEnvEnabled() && !hasRealServerUpstashEnv()) {
    validated = getCiPlaceholderServerUpstashEnv();
    return validated;
  }

  const raw = readServerUpstashEnvFromProcess();

  const result = authEnvSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `[auth] Invalid environment variables:\n${errors}\n\nSee apps/auth/env.template for required values.`
    );
  }

  validated = result.data;
  return validated;
}
