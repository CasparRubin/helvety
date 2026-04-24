import "server-only";

import { requireAuth } from "./auth-guard";

import type { User } from "@supabase/supabase-js";

/**
 * Canonical entry paths for apps that use `EncryptionGateApp` in their layout.
 * Keep in sync with `requiresE2eeBrowserUnlock` in `./e2ee-app-paths`.
 */
export const E2EE_APP_PAGE_PATHS = ["/contacts", "/notes", "/tasks"] as const;

/** Public path argument accepted by `requireE2eeAppPageAuth`. */
export type E2eeAppPagePath = (typeof E2EE_APP_PAGE_PATHS)[number];

/**
 * Server-side guard for E2EE app pages (contacts, notes, tasks).
 *
 * Each app’s default `page.tsx` should `await` this with its public path so
 * new routes do not ship without an explicit auth check — layouts only wrap
 * `EncryptionGateApp` when a user exists and do not replace `requireAuth`.
 */
export async function requireE2eeAppPageAuth(
  currentPublicPath: E2eeAppPagePath
): Promise<User> {
  return requireAuth(currentPublicPath);
}
