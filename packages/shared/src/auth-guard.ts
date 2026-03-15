import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { shouldForceHardLogout } from "./auth-errors";
import { getLoginUrl, getLogoutUrl } from "./auth-redirect";
import { getUserWithRetry } from "./auth-retry";
import { getCachedAuthLookup, getCachedUser } from "./cached-server";
import { urls } from "./config";
import { resolveRequestOrigin } from "./request-origin";
import { createServerClient } from "./supabase/server";

import type { User } from "@supabase/supabase-js";

/**
 * Server-side authentication guard for protected routes.
 *
 * Use this in Server Components to ensure the user is authenticated.
 * Redirect behavior:
 * - clean logged-out state -> auth login
 * - invalid/broken auth state -> global logout, then auth login
 *
 * Internally uses a cached auth lookup (React.cache + transient retry) so that
 * when a layout already fetched user state for UI purposes, requireAuth()
 * usually reuses that result. On transient auth errors, requireAuth() performs
 * one uncached confirmation check before redirecting.
 *
 * IMPORTANT: Authentication checks should be done in Server Components (pages)
 * or Route Handlers, NOT in proxy.ts. Proxy is an optimistic routing layer and
 * should not be treated as an authoritative access control boundary.
 *
 * @param currentPath - The public-facing path of the current page (e.g. "/tasks"
 *   or "/tasks?item=<id>"). Used to build the redirect-back URL so the user
 *   returns here after authenticating. In Next.js 16, proxy-provided request
 *   headers may not be available in Server Components in all environments, so
 *   this parameter is the canonical redirect source.
 *
 * @example
 * // In a protected page
 * export default async function Page() {
 *   const user = await requireAuth("/tasks");
 *   return <>{user.email}</>;
 * }
 */
export async function requireAuth(currentPath?: string): Promise<User> {
  const { user, error } = await getCachedAuthLookup();

  if (user) {
    return user;
  }

  // If the cached attempt failed due to a transient auth/network error,
  // confirm once more without relying on the cached value before redirecting.
  let authErrorMessage = error?.message ?? null;
  if (error) {
    const supabase = await createServerClient();
    const recovery = await getUserWithRetry(supabase);
    if (recovery.user) {
      return recovery.user;
    }
    authErrorMessage = recovery.error?.message ?? authErrorMessage;
  }

  const headersList = await headers();
  const headerUrl = headersList.get("x-helvety-url") ?? undefined;
  const requestOrigin = resolveRequestOrigin(headersList);
  const relativeDestination =
    currentPath?.startsWith("/") ? currentPath : undefined;
  const fallbackUrl =
    requestOrigin && relativeDestination
      ? `${requestOrigin}${relativeDestination}`
      : currentPath;
  const destination = fallbackUrl ?? headerUrl ?? urls.home;

  if (shouldForceHardLogout(authErrorMessage)) {
    redirect(
      getLogoutUrl(destination, {
        global: true,
      })
    );
  }

  redirect(getLoginUrl(destination));
}

/**
 * Get the current user without requiring authentication.
 *
 * Use this when you want to check if a user is logged in
 * but don't want to redirect if they're not.
 *
 * Uses getCachedUser() internally so it shares the same per-request
 * cached result with requireAuth() and layout getCachedUser() calls.
 *
 * @example
 * // In a page that shows different content for logged in users
 * const user = await getOptionalUser();
 * if (user) {
 *   // Show personalized content
 * }
 */
export async function getOptionalUser(): Promise<User | null> {
  return getCachedUser();
}

/**
 * Check if the current request is authenticated.
 *
 * Use this for conditional logic without getting the full user object.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getOptionalUser();
  return user !== null;
}
