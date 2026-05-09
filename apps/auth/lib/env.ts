import "server-only";

import {
  serverEnvSchema,
  upstashEnvSchema,
  validateServerUpstashEnv,
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
  validated = validateServerUpstashEnv({
    appName: "auth",
    envTemplatePath: "apps/auth/env.template",
    schema: authEnvSchema,
    readExtraFromProcess: () => ({
      DEVICE_TRUST_COOKIE_SECRET:
        process.env.DEVICE_TRUST_COOKIE_SECRET?.trim() ?? "",
    }),
    ciPlaceholderExtra: {
      DEVICE_TRUST_COOKIE_SECRET:
        "ci_build_placeholder_device_trust_cookie_secret_not_for_production",
    },
  });
  return validated;
}
