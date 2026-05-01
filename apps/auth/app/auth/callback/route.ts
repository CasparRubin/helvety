import { createAuthCallbackHandler } from "@helvety/shared/auth-callback";
import { urls } from "@helvety/shared/config";

import { checkUserPasskeyStatus } from "@/app/actions/auth-action-helpers";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";
import { resolveAuthStep } from "@/lib/auth-step";

import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ALLOWED_OTP_TYPES: EmailOtpType[] = [
  "magiclink",
  "signup",
  "recovery",
  "invite",
  "email_change",
];

/** Builds a login redirect URL with optional error and original redirect target. */
function buildErrorRedirect(
  authBase: string,
  error?: string,
  redirectUri?: string | null
): string {
  const loginUrl = new URL(`${authBase}/login`);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  if (redirectUri) {
    loginUrl.searchParams.set("redirect_uri", redirectUri);
  }
  return loginUrl.toString();
}

/** Resolves the post-session redirect URL after callback auth succeeds. */
async function buildPostAuthRedirect(
  authBase: string,
  safeRedirectUri: string | null,
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildErrorRedirect(authBase, "auth_failed", safeRedirectUri);
  }

  const [passkeyResult, encryptionResult] = await Promise.all([
    checkUserPasskeyStatus(user.id),
    hasEncryptionSetup(),
  ]);
  const hasPasskey = passkeyResult.success && passkeyResult.data?.hasPasskey;
  const hasEncryption = encryptionResult.success && encryptionResult.data;
  const step = resolveAuthStep({
    hasPasskey: Boolean(hasPasskey),
    hasEncryption: Boolean(hasEncryption),
  });

  const loginUrl = new URL(`${authBase}/login`);
  loginUrl.searchParams.set("step", step);
  if (safeRedirectUri) {
    loginUrl.searchParams.set("redirect_uri", safeRedirectUri);
  }
  return loginUrl.toString();
}

/**
 * Auth callback route for handling Supabase email verification and OAuth
 *
 * This route is the canonical auth callback endpoint for Supabase email/OAuth
 * verification flows. The primary sign-in UX still centers typed OTP codes
 * followed by passkey setup/sign-in after callback completion.
 *
 * It handles:
 * - Account recovery, invite, and email change confirmation links
 * - OAuth flows
 *
 * NOTE: This route is NOT used for passkey sign-in. Passkey authentication
 * creates the session directly server-side in verifyPasskeyAuthentication()
 * and returns a redirect URL to the client without going through this callback.
 *
 * After successful email auth, checks if user has passkey and encryption:
 * - If no passkey: redirects to login with step=encryption-setup (new user flow)
 * - If has passkey but no encryption: redirects to login with step=encryption-setup
 * - If has passkey and encryption: redirects to passkey-signin step
 *
 * Supports redirect_uri query param for returning users to the originating app after sign-in.
 * Redirect URIs are validated against an allowlist to prevent open redirects.
 * Rate limited by IP to prevent auth callback abuse.
 */
export const GET = createAuthCallbackHandler({
  allowedOtpTypes: ALLOWED_OTP_TYPES,
  buildLoginUrl: (redirectUri) =>
    buildErrorRedirect(urls.auth, undefined, redirectUri),
  onAuthSuccessRedirect: async ({ safeRedirectUri, supabase }) =>
    buildPostAuthRedirect(urls.auth, safeRedirectUri, supabase),
});
