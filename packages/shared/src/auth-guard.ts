import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { shouldForceHardLogout } from "./auth-errors";
import { getLoginUrl, getLogoutUrl } from "./auth-redirect";
import { getCachedAuthLookup } from "./cached-server";
import { urls } from "./config";
import { getValidDeviceTrustFromCookieStore } from "./device-trust-cookie";
import { isValidRelativePath } from "./redirect-validation";
import { resolveRequestOrigin } from "./request-origin";

import type { User } from "@supabase/supabase-js";

/** Options for {@link requireAuth}. */
export type RequireAuthOptions = Readonly<{
  /** When true, missing/expired device trust forces global logout (weekly email proof). */
  requireDeviceTrust?: boolean;
}>;

/**
 * Server-side authentication guard for protected routes.
 *
 * Use this in Server Components to ensure the user is authenticated.
 * Redirect behavior:
 * - clean logged-out state -> auth login
 * - invalid/broken auth state -> global logout, then auth login
 * - authenticated but missing weekly email proof (when required) -> global logout
 *
 * Fail-closed: one cached getUser() call (shared with the layout).
 * No user = redirect. No retries, no second chances.
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
export async function requireAuth(
  currentPath?: string,
  options?: RequireAuthOptions
): Promise<User> {
  const { user, error } = await getCachedAuthLookup();
  const destination = await resolveAuthRedirectDestination(currentPath);

  if (user) {
    if (options?.requireDeviceTrust) {
      const cookieStore = await cookies();
      const trust = getValidDeviceTrustFromCookieStore(cookieStore);
      if (trust?.userId !== user.id) {
        redirect(
          getLogoutUrl(destination, {
            global: true,
          })
        );
      }
    }
    return user;
  }

  const authErrorMessage = error?.message ?? null;

  if (shouldForceHardLogout(authErrorMessage)) {
    redirect(
      getLogoutUrl(destination, {
        global: true,
      })
    );
  }

  redirect(getLoginUrl(destination));
}

/** Build redirect destination from page path and request headers. */
async function resolveAuthRedirectDestination(
  currentPath?: string
): Promise<string> {
  const headersList = await headers();
  const headerUrl = headersList.get("x-helvety-url") ?? undefined;
  const requestOrigin = resolveRequestOrigin(headersList);
  const relativeDestination = isValidRelativePath(currentPath)
    ? currentPath
    : undefined;
  const fallbackUrl =
    requestOrigin && relativeDestination
      ? `${requestOrigin}${relativeDestination}`
      : currentPath;
  return fallbackUrl ?? headerUrl ?? urls.home;
}
