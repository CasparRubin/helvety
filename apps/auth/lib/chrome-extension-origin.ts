import "server-only";

import { getValidatedAuthEnv } from "@/lib/env";

/** True when `origin` is a well-formed allowlisted Chrome extension origin. */
export function isAllowedChromeExtensionOrigin(origin: string): boolean {
  if (!origin.startsWith("chrome-extension://")) {
    return false;
  }
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "chrome-extension:" || !parsed.host) {
      return false;
    }
  } catch {
    return false;
  }
  const { HELVETY_CHROME_EXTENSION_ORIGINS } = getValidatedAuthEnv();
  return HELVETY_CHROME_EXTENSION_ORIGINS.includes(origin);
}
