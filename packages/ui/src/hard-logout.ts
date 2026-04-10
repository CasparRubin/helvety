"use client";

import { redirectToGlobalLogout } from "@helvety/shared/auth-redirect";
import { clearAllKeys } from "@helvety/shared/crypto/key-storage";
import { clearCachedPRFSalt } from "@helvety/shared/crypto/prf-salt-cache";

/**
 * Clears local encryption/session artifacts and redirects to centralized global
 * logout so re-authentication returns through the shared auth flow.
 */
export async function forceHardLogout(redirectUri?: string): Promise<void> {
  try {
    await clearAllKeys();
  } catch {
    // Continue to logout even if local key cleanup fails.
  }

  try {
    clearCachedPRFSalt();
  } catch {
    // Continue to logout even if local cache cleanup fails.
  }

  const target =
    redirectUri ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  redirectToGlobalLogout(target);
}
