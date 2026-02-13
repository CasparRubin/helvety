import "server-only";

import { redirect } from "next/navigation";

import { getLoginUrl } from "@/lib/auth-redirect";
import { getUserWithRetry } from "@/lib/auth-retry";
import { createClient } from "@/lib/supabase/server";

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
 * @example
 * // In a protected layout
 * export default async function ProtectedLayout({ children }) {
 *   await requireAuth();
 *   return <>{children}</>;
 * }
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const { user, error } = await getUserWithRetry(supabase);

  if (error || !user) {
    // Redirect to auth service login
    redirect(getLoginUrl());
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
  const supabase = await createClient();
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
