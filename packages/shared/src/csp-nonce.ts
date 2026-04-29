import "server-only";

import { headers } from "next/headers";

/**
 * Reads CSP nonce from request headers.
 * Returns null when not available so callers can omit nonce attributes.
 */
export async function getRequestCspNonce(): Promise<string | null> {
  return (await headers()).get("x-nonce");
}
