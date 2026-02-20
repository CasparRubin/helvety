import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getLoginUrl } from "./auth-redirect";
import { getUserWithRetry } from "./auth-retry";
import { urls } from "./config";
import { createServerClient } from "./supabase/server";

import type { User } from "@supabase/supabase-js";

/**
 * Server-side authentication guard for protected routes.
 *
 * Use this in Server Components or Server Actions to ensure the user is authenticated.
 * Redirects to the auth service login page if not authenticated.
 *
 * Includes a single retry with a short delay to handle transient network
 * failures (VPN, Private Relay, mobile) that would otherwise cause false
 * login redirects.
 *
 * IMPORTANT: Per CVE-2025-29927, authentication checks should be done in
 * Server Layout Guards or Route Handlers, NOT in proxy.ts.
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
  const supabase = await createServerClient();
  const { user, error } = await getUserWithRetry(supabase);

  if (error || !user) {
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
 * Note: Unlike requireAuth(), this does NOT retry on failure. A transient
 * network error simply returns null (user not found), which is acceptable
 * for optional/non-critical checks where missing the user is safe.
 *
 * @example
 * // In a page that shows different content for logged in users
 * const user = await getOptionalUser();
 * if (user) {
 *   // Show personalized content
 * }
 */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
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
