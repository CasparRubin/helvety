import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getLoginUrl } from "./auth-redirect";
import { getCachedUser } from "./cached-server";
import { urls } from "./config";

import type { User } from "@supabase/supabase-js";

/**
 * Server-side authentication guard for protected routes.
 *
 * Use this in Server Components to ensure the user is authenticated.
 * Redirects to the auth service login page if not authenticated.
 *
 * Internally uses getCachedUser() (React.cache + retry) so that when a
 * layout already called getCachedUser() for UI purposes, the page's
 * requireAuth() reuses the same result — no duplicate Supabase call.
 *
 * IMPORTANT: Per CVE-2025-29927, authentication checks should be done in
 * Server Components (pages) or Route Handlers, NOT in proxy.ts.
 *
 * @param currentPath - The public-facing path of the current page (e.g. "/tasks"
 *   or "/tasks/units/123"). Used to build the redirect-back URL so the user
 *   returns here after authenticating. In Next.js 16, custom request headers
 *   set in proxy.ts do not reach server components, so this parameter is the
 *   primary source for the redirect URL.
 *
 * @example
 * // In a protected page
 * export default async function Page() {
 *   const user = await requireAuth("/tasks");
 *   return <>{user.email}</>;
 * }
 */
export async function requireAuth(currentPath?: string): Promise<User> {
  const user = await getCachedUser();

  if (!user) {
    const headersList = await headers();
    const headerUrl = headersList.get("x-helvety-url") ?? undefined;
    const fallbackUrl = currentPath ? `${urls.home}${currentPath}` : undefined;
    redirect(getLoginUrl(headerUrl ?? fallbackUrl));
  }

  return user;
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
