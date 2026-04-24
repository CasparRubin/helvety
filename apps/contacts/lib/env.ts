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

const contactsEnvSchema = serverEnvSchema.merge(upstashEnvSchema);

let validated: z.infer<typeof contactsEnvSchema> | null = null;

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * of the three values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedContactsEnv(): z.infer<typeof contactsEnvSchema> {
  if (validated) return validated;

  if (isCiBuildPlaceholderEnvEnabled() && !hasRealServerUpstashEnv()) {
    validated = getCiPlaceholderServerUpstashEnv();
    return validated;
  }

  const raw = readServerUpstashEnvFromProcess();

  const result = contactsEnvSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `[contacts] Invalid environment variables:\n${errors}\n\nSee apps/contacts/env.template for required values.`
    );
  }

  validated = result.data;
  return validated;
}
