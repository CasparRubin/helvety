import "server-only";

import { validateCookieSigningEnv } from "@helvety/shared/env-validation";

let validated: ReturnType<typeof validateCookieSigningEnv> | null = null;

/**
 * Validates cookie signing env on first call, then caches.
 *
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders when the secret
 * is missing. See repository root `README.md` → Automation (`ci:release`).
 */
export function getValidatedPdfEnv(): ReturnType<
  typeof validateCookieSigningEnv
> {
  if (validated) return validated;
  validated = validateCookieSigningEnv({
    appName: "pdf",
    envTemplatePath: "apps/pdf/env.template",
  });
  return validated;
}
