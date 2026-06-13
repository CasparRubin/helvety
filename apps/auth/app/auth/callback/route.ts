import { createAuthCallbackHandler } from "@helvety/shared/auth-callback";
import { getAuthUser } from "@helvety/shared/auth-retry";
import { logger } from "@helvety/shared/logger";

import { checkUserPasskeyStatus } from "@/app/actions/auth-action-helpers";
import { mintAndVerifyDeviceTrustCookie } from "@/app/actions/device-trust-cookie";
import { hasEncryptionSetup } from "@/app/actions/encryption-actions";
import { resolveAuthStep } from "@/lib/auth-step";
import { buildAuthLoginUrl } from "@/lib/login-entry";

import type {
  EmailOtpType,
  SupabaseClient,
} from "@helvety/shared/supabase-types";

export const runtime = "nodejs";

const ALLOWED_OTP_TYPES: EmailOtpType[] = [
  "magiclink",
  "signup",
  "recovery",
  "invite",
  "email_change",
];

/** Resolves the post-session redirect URL after callback auth succeeds. */
async function buildPostAuthRedirect(
  safeRedirectUri: string | null,
  supabase: SupabaseClient
): Promise<string> {
  const { user } = await getAuthUser(supabase);

  if (!user) {
    return buildAuthLoginUrl({
      redirectUri: safeRedirectUri,
      error: "auth_failed",
    });
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

  return buildAuthLoginUrl({
    redirectUri: safeRedirectUri,
    step,
  });
}

/**
 * Auth callback route for handling Supabase email verification and OAuth
 *
 * This route is the canonical auth callback endpoint for Supabase email/OAuth
 * verification flows. The primary sign-in UX still centers typed OTP codes
 * followed by passkey setup/sign-in after callback completion.
 *
 * OTP allowlist intentionally excludes `"email"`: primary OTP verification uses
 * server actions (`verifyOtp` with `type: "email"`), not this GET handler.
 * Link-based callbacks here accept magiclink/signup/recovery/invite/email_change only.
 *
 * It handles:
 * - Account recovery, invite, and email change confirmation links
 * - OAuth flows
 *
 * NOTE: This route is NOT used for passkey sign-in. Passkey authentication
 * creates the session directly server-side in verifyPasskeyAuthentication()
 * and returns a redirect URL to the client without going through this callback.
 *
 * After successful email auth, mints `helvety_device_trust` (same as OTP verify) and
 * checks if user has passkey and encryption:
 * - If no passkey: redirects to login with step=encryption-setup (new user flow)
 * - If has passkey but no encryption: redirects to login with step=encryption-setup
 * - If has passkey and encryption: redirects to login with step=passkey-signin
 *
 * Supports redirect_uri query param for returning users to the originating app after sign-in.
 * Redirect URIs are validated against an allowlist to prevent open redirects.
 * Rate limited by IP to prevent auth callback abuse.
 */
export const GET = createAuthCallbackHandler({
  allowedOtpTypes: ALLOWED_OTP_TYPES,
  buildLoginUrl: (redirectUri) =>
    buildAuthLoginUrl({ redirectUri: redirectUri ?? undefined }),
  onAuthSuccessRedirect: async ({ safeRedirectUri, supabase }) => {
    const { user } = await getAuthUser(supabase);
    if (user) {
      try {
        const deviceTrustMinted = await mintAndVerifyDeviceTrustCookie(user.id);
        if (!deviceTrustMinted) {
          logger.logUnexpectedError(
            "Device trust cookie mint/read-back failed after auth callback",
            new Error("helvety_device_trust not readable after set"),
            { userId: user.id }
          );
        }
      } catch (trustError) {
        logger.logUnexpectedError(
          "Failed to set device trust cookie after auth callback",
          trustError,
          { userId: user.id }
        );
      }
    }
    return buildPostAuthRedirect(safeRedirectUri, supabase);
  },
});
