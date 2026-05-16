/**
 * Path prefixes for apps that use EncryptionGate and require a browser passkey
 * unlock (master key) before the UI can load - not just a Supabase session.
 *
 * Keep in sync with apps using `EncryptionGateApp` (contacts, links, notes, tasks).
 * Server pages for those apps should call `requireE2eeAppPageAuth` from
 * `@helvety/shared/e2ee-page-auth` so new routes keep an explicit `requireAuth`.
 */

const E2EE_PATH_PREFIXES = ["/notes", "/tasks", "/contacts", "/links"] as const;

/**
 * Returns true when `uri` points at an E2EE app route where browser unlock
 * (master-key availability) is required after authentication.
 */
export function requiresE2eeBrowserUnlock(uri: string): boolean {
  try {
    const pathname = new URL(uri).pathname.replace(/\/$/, "") || "/";
    return E2EE_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  } catch {
    return false;
  }
}
