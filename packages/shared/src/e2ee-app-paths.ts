/**
 * Path prefixes for apps that use EncryptionGate and require a browser passkey
 * unlock (master key) before the UI can load — not just a Supabase session.
 *
 * Keep in sync with apps using `EncryptionGateApp` (notes, tasks, contacts).
 */

const E2EE_PATH_PREFIXES = ["/notes", "/tasks", "/contacts"] as const;

/**
 * Returns true when `uri` points at an E2EE app route where login must not
 * auto-skip the passkey step (local crypto unlock).
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
