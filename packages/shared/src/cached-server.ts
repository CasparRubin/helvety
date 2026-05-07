import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { getAuthUser } from "./auth-retry";
import { getCSRFTokenFromCookieValue } from "./csrf";
import { CSRF_BOOTSTRAP_HEADER_NAME } from "./proxy";
import { createServerClient } from "./supabase/server";

import type { AuthError, User } from "@supabase/supabase-js";

const CSRF_COOKIE_NAME = "csrf_token";

/**
 * Per-request cached auth lookup (single getUser call, no retries).
 *
 * Keeps the last auth error so guards can distinguish:
 * - clean unauthenticated state (user: null, error: null)
 * - auth lookup failure (user: null, error: AuthError)
 */
export const getCachedAuthLookup = cache(
  async (): Promise<{ user: User | null; error: AuthError | null }> => {
    const supabase = await createServerClient();
    return getAuthUser(supabase);
  }
);

/**
 * Per-request cached version of getUser() for layout/navbar consumers.
 * Deduplicates auth lookups when both layout and page need current user.
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const { user } = await getCachedAuthLookup();
  return user;
});

/**
 * Per-request cached CSRF token reader.
 * Deduplicates cookie reads when the layout and child page both
 * need the token within a single render pass.
 */
export const getCachedCSRFToken = cache(async (): Promise<string | null> => {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const cookieToken = await getCSRFTokenFromCookieValue(
    cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null
  );

  if (cookieToken) {
    return cookieToken;
  }

  return headersList.get(CSRF_BOOTSTRAP_HEADER_NAME);
});
