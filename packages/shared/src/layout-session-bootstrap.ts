import "server-only";

import { getCachedCSRFToken, getCachedUser } from "./cached-server";
import { logger } from "./logger";

import type { User } from "@supabase/supabase-js";

/**
 * Loads `getCachedUser` for public-shell layouts; logs and returns null on failure.
 */
export async function bootstrapPublicLayoutUser(): Promise<User | null> {
  try {
    return await getCachedUser();
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
    return null;
  }
}

/**
 * Loads CSRF token + session user for E2EE app shells; logs and returns empty CSRF / null user on failure.
 */
export async function bootstrapE2eeLayoutSession(): Promise<{
  csrfToken: string;
  initialUser: User | null;
}> {
  try {
    const [csrfToken, initialUser] = await Promise.all([
      getCachedCSRFToken().then((t) => t ?? ""),
      getCachedUser(),
    ]);
    return { csrfToken, initialUser };
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
    return { csrfToken: "", initialUser: null };
  }
}
