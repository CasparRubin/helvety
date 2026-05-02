import { urls } from "@helvety/shared/config";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { redirect } from "next/navigation";

/**
 * Root page - redirects to login with any redirect_uri preserved
 *
 * The login page handles authentication logic including:
 * - Checking if user is authenticated
 * - Checking passkey/encryption status
 * - Choosing passkey sign-in vs redirect (E2EE app destinations do not skip passkey)
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const params = await searchParams;
  const rawRedirectUri = params.redirect_uri;

  // Validate redirect URI against allowlist
  const safeRedirectUri = getSafeRedirectUri(rawRedirectUri, null);

  // Build login URL with redirect_uri if valid
  const redirectTarget = safeRedirectUri ?? urls.home;
  const loginUrl = `/login?redirect_uri=${encodeURIComponent(redirectTarget)}`;

  // Redirect to login page - it handles all auth logic
  redirect(loginUrl);
}
