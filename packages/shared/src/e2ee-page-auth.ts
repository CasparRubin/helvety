import "server-only";

import { requireAuth } from "./auth-guard";

import type { User } from "@supabase/supabase-js";

/**
 * Canonical entry paths for apps that use `EncryptionGateApp` in their layout.
 */
export const E2EE_APP_PAGE_PATHS = [
  "/contacts",
  "/links",
  "/notes",
  "/tasks",
] as const;

/**
 * Returns true when `uri` points at an E2EE app route where browser unlock
 * (master-key availability) is required after authentication.
 */
export function requiresE2eeBrowserUnlock(uri: string): boolean {
  try {
    const pathname = new URL(uri).pathname.replace(/\/$/, "") || "/";
    return E2EE_APP_PAGE_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  } catch {
    return false;
  }
}

/** Public path argument accepted by `requireE2eeAppPageAuth`. */
export type E2eeAppPagePath = (typeof E2EE_APP_PAGE_PATHS)[number];

/**
 * Rate-limit prefixes used by E2EE vault zones.
 * {@link authenticateAndRateLimit} requires weekly device trust on helvety.com for these by default.
 */
export const E2EE_DEVICE_TRUST_RATE_LIMIT_PREFIXES = new Set([
  "tasks",
  "contacts",
  "notes",
  "links",
  "export",
  "task-links",
  "contact-links",
  "note-links",
]);

/** True when server actions/API routes for this prefix require device trust on helvety.com. */
export function requiresE2eeDeviceTrust(rateLimitPrefix: string): boolean {
  return E2EE_DEVICE_TRUST_RATE_LIMIT_PREFIXES.has(rateLimitPrefix);
}

/**
 * Server-side guard for E2EE app pages (contacts, links, notes, tasks).
 *
 * Each app’s default `page.tsx` should `await` this with its public path so
 * new routes do not ship without an explicit auth check - layouts only wrap
 * `EncryptionGateApp` when a user exists and do not replace `requireAuth`.
 */
export async function requireE2eeAppPageAuth(
  currentPublicPath: E2eeAppPagePath
): Promise<User> {
  return requireAuth(currentPublicPath, { requireDeviceTrust: true });
}
