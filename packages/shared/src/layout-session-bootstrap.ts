import "server-only";

import { getCachedCSRFToken, getCachedUser } from "./cached-server";
import { logger } from "./logger";

import type { User } from "@supabase/supabase-js";

/**
 * Loads `getCachedUser` for public-shell layouts that only need a navbar user snapshot
 * (no CSRF). Used by `apps/web`, `apps/pdf`, and `apps/image-upscaler`.
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
 * CSRF + user bootstrap for the auth gateway layout (delegates to
 * {@link bootstrapE2eeLayoutSession}).
 */
export async function bootstrapAuthLayoutSession(): Promise<{
  csrfToken: string;
  initialUser: User | null;
}> {
  return bootstrapE2eeLayoutSession();
}

/**
 * Loads CSRF token + session user in parallel for layouts that wrap content in
 * `CSRFProvider`. Used by `apps/store`, `apps/auth`, and `@helvety/ui/e2ee-app-root-layout` (tasks, contacts, notes,
 * links). The layout token is the initial value; auth OTP verify may return a
 * rotated token for `useSetCSRFToken` before subsequent actions on the same
 * page. Logs and returns empty CSRF / null user on failure.
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
