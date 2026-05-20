import "server-only";

import { DEV_PORTS, DOMAIN } from "@helvety/shared/config";

export const RP_NAME = "Helvety";

/**
 * Get the Relying Party ID.
 *
 * For centralized auth in production, use the root domain so passkeys
 * registered on /auth also work on other app paths.
 */
export function getRpId(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "localhost";
    }
    return DOMAIN;
  } catch {
    return DOMAIN;
  }
}

/**
 * Optional comma-separated list of extra WebAuthn client origins (for example
 * `chrome-extension://<extension-id>`) allowed during passkey verification.
 *
 * Configure in the auth app environment so Chromium extensions using the
 * Helvety design system can complete WebAuthn with the same RP ID as the web.
 */
export function getConfiguredExtensionWebAuthnOrigins(): string[] {
  const raw = process.env.HELVETY_WEBAUTHN_EXTENSION_ORIGINS?.trim() ?? "";
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Get expected origins for passkey verification.
 */
export function getExpectedOrigins(rpId: string): string[] {
  if (rpId === "localhost") {
    return [
      ...Object.values(DEV_PORTS).map((port) => `http://localhost:${port}`),
      ...Object.values(DEV_PORTS).map((port) => `http://127.0.0.1:${port}`),
      ...getConfiguredExtensionWebAuthnOrigins(),
    ];
  }

  return [`https://${DOMAIN}`, ...getConfiguredExtensionWebAuthnOrigins()];
}
