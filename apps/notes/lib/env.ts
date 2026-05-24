import "server-only";

import {
  createAppUserScopedEnv,
  userScopedServerEnvSchema,
} from "@helvety/shared/env-validation";

/**
 * Validates Upstash + cookie signing env on first call, then caches.
 *
 * Vault CRUD uses the user-scoped Supabase client + RLS (no admin client).
 * With `SKIP_ENV_VALIDATION=1` off Vercel: uses CI placeholders only when any
 * required server env values are missing. See repository root `README.md` → Automation (`ci:release`).
 */
export const getValidatedNotesEnv = createAppUserScopedEnv({
  appName: "notes",
  envTemplatePath: "apps/notes/env.template",
  schema: userScopedServerEnvSchema,
});
