import "server-only";

import {
  getCiPlaceholderServerUpstashEnv,
  hasRealServerUpstashEnv,
  isCiBuildPlaceholderEnvEnabled,
  readServerUpstashEnvFromProcess,
  serverEnvSchema,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";
import { z } from "zod";

const authEnvSchema = serverEnvSchema.merge(upstashEnvSchema).merge(
  z.object({
    DEVICE_TRUST_COOKIE_SECRET: z
      .string()
      .min(
        32,
        "DEVICE_TRUST_COOKIE_SECRET must be at least 32 characters (used to sign device trust cookies)"
      ),
  })
);

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
    validated = {
      ...getCiPlaceholderServerUpstashEnv(),
      DEVICE_TRUST_COOKIE_SECRET:
        "ci_build_placeholder_device_trust_cookie_secret_not_for_production",
    };
    return validated;
  }

  const raw = {
    ...readServerUpstashEnvFromProcess(),
    DEVICE_TRUST_COOKIE_SECRET:
      process.env.DEVICE_TRUST_COOKIE_SECRET?.trim() ?? "",
  };

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
