import "server-only";

import { createServerClient } from "@helvety/shared/supabase/server";
import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

/**
 * Server-side authentication guard for protected routes.
 *
 * Use this in Server Components or Server Actions to ensure the user is authenticated.
 * Redirects to the login page if not authenticated.
 *
 * NOTE: Unlike the auth-guard in other apps (which use getUserWithRetry from
 * @helvety/shared/auth-retry), this version intentionally omits retry logic.
 * Reason: The auth app redirects to its own /login page (same origin), so a
 * transient network failure during getUser() simply lands the user back on the
 * login form where they can re-authenticate immediately. Retrying here would
 * add latency without meaningful benefit, since the auth app IS the login page.
 *
 * Other apps (tasks, contacts, store, etc.) DO use retry logic because they
 * redirect to helvety.com/auth, where a false redirect would be more
 * disruptive to the user experience.
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
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // In auth service, redirect to login page directly (same origin)
    redirect("/login");
  }

  return user;
}

/**
 * Get the current user without requiring authentication.
 *
 * Use this when you want to check if a user is logged in
 * but don't want to redirect if they're not.
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
