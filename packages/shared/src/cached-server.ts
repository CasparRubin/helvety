import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { getUserWithRetry } from "./auth-retry";
import { createServerClient } from "./supabase/server";

import type { User } from "@supabase/supabase-js";

const CSRF_COOKIE_NAME = "csrf_token";

/**
 * Per-request cached version of getUser() with retry for transient failures.
 * Deduplicates the Supabase auth call when both the layout and
 * page (via requireAuth) need the current user within a single request.
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerClient();
  const { user } = await getUserWithRetry(supabase);
  return user;
});

/**
 * Per-request cached CSRF token reader.
 * Deduplicates cookie reads when the layout and child page both
 * need the token within a single render pass.
 */
export const getCachedCSRFToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
});
