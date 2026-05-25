import "server-only";

import { DEV_PORTS, DOMAIN } from "@helvety/shared/config";

import { isAllowedChromeExtensionOrigin } from "@/lib/chrome-extension-origin";

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
 * Get expected origins for passkey verification.
 *
 * @param clientOrigin - When set (e.g. `chrome-extension://<id>`), include it so
 *   extension unlock ceremonies verify against the caller origin.
 */
export function getExpectedOrigins(
  rpId: string,
  clientOrigin?: string
): string[] {
  const origins =
    rpId === "localhost"
      ? [
          ...Object.values(DEV_PORTS).map((port) => `http://localhost:${port}`),
          ...Object.values(DEV_PORTS).map((port) => `http://127.0.0.1:${port}`),
        ]
      : [`https://${DOMAIN}`];

  if (
    clientOrigin &&
    isAllowedChromeExtensionOrigin(clientOrigin) &&
    !origins.includes(clientOrigin)
  ) {
    return [...origins, clientOrigin];
  }

  return origins;
}
