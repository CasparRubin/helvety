import "server-only";

import {
  cookieSigningEnvSchema,
  createAppServerUpstashEnv,
  serverEnvSchema,
  upstashEnvSchema,
} from "@helvety/shared/env-validation";
import { z } from "zod";

import { parseChromeExtensionOriginsEnv } from "@/lib/chrome-extension-origin-parse";
import { readChromeExtensionOriginsFromProcessEnv } from "@/lib/chrome-extension-origins-env";

const authEnvSchema = serverEnvSchema
  .merge(upstashEnvSchema)
  .merge(cookieSigningEnvSchema)
  .merge(
    z.object({
      DEVICE_TRUST_COOKIE_SECRET: z
        .string()
        .min(
          32,
          "DEVICE_TRUST_COOKIE_SECRET must be at least 32 characters (used to sign device trust cookies)"
        ),
      HELVETY_CHROME_EXTENSION_ORIGINS: z
        .string()
        .min(1, "HELVETY_CHROME_EXTENSION_ORIGINS is required")
        .transform((raw, ctx) => {
          try {
            return parseChromeExtensionOriginsEnv(raw);
          } catch (error) {
            ctx.addIssue({
              code: "custom",
              message:
                error instanceof Error
                  ? error.message
                  : "Invalid HELVETY_CHROME_EXTENSION_ORIGINS",
            });
            return z.NEVER;
          }
        }),
    })
  );

/**
 * Validates server-only Supabase + Upstash env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing; otherwise validates `process.env` with Zod.
 * See repository root `README.md` → Automation (`ci:release`).
 */
export const getValidatedAuthEnv = createAppServerUpstashEnv({
  appName: "auth",
  envTemplatePath: "apps/auth/env.template",
  schema: authEnvSchema,
  readExtraFromProcess: () => ({
    DEVICE_TRUST_COOKIE_SECRET:
      process.env.DEVICE_TRUST_COOKIE_SECRET?.trim() ?? "",
    HELVETY_CHROME_EXTENSION_ORIGINS:
      readChromeExtensionOriginsFromProcessEnv(),
  }),
  ciPlaceholderExtra: {
    DEVICE_TRUST_COOKIE_SECRET:
      "ci_build_placeholder_device_trust_cookie_secret_not_for_production",
    HELVETY_CHROME_EXTENSION_ORIGINS:
      "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef",
  },
});
