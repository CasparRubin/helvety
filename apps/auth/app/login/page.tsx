import { getAuthUser } from "@helvety/shared/auth-retry";
import { urls } from "@helvety/shared/config";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { createServerClient } from "@helvety/shared/supabase/server";
import { redirect } from "next/navigation";

import { getDeviceTrustStatus } from "@/app/actions/device-trust-actions";
import { getRequiredAuthStep } from "@/lib/auth-utils";
import { buildAuthLoginPath, resolveLoginEntryStep } from "@/lib/login-entry";

import { LoginClient } from "./login-client";

import type { RequiredAuthStep } from "@/lib/auth-step";
import type { LoginStep } from "@/lib/login-flow-stepper";

const LOGIN_STEPS = new Set<LoginStep>([
  "email",
  "verify-code",
  "passkey-signin",
  "encryption-setup",
]);

/**
 *
 */
function parseUrlStep(value: string | undefined): LoginStep | null {
  if (value && LOGIN_STEPS.has(value as LoginStep)) {
    return value as LoginStep;
  }
  return null;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  missing_params: "Invalid authentication link.",
  logout_failed: "We couldn't complete sign-out. Please sign in and try again.",
  rate_limited:
    "Too many sign-in attempts. Please wait a moment and try again.",
  missing_client_ip: "We couldn't verify your connection. Please try again.",
  server_error: "Authentication is temporarily unavailable. Please try again.",
  invalid_type:
    "This verification link is invalid or expired. Please request a new sign-in code and try again.",
  invalid_otp_type:
    "This verification link is invalid or expired. Please request a new sign-in code and try again.",
};

/** Server gate for `/auth/login`: resolves entry step and canonicalizes trusted URLs. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_uri?: string;
    step?: string;
    force_login?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const rawRedirectUri = params.redirect_uri;
  const safeRedirectUri = getSafeRedirectUri(rawRedirectUri, urls.home);
  const forceLogin = params.force_login === "1";
  const urlStep = parseUrlStep(params.step);
  const authError = params.error;
  const initialError = authError ? (AUTH_ERROR_MESSAGES[authError] ?? "") : "";

  const supabase = await createServerClient();
  const { user } = await getAuthUser(supabase);
  const trustResult = await getDeviceTrustStatus();
  const trust =
    trustResult.success && trustResult.data.trusted
      ? {
          trusted: true as const,
          userId: trustResult.data.userId,
        }
      : { trusted: false as const, userId: null };

  let requiredAuthStep: RequiredAuthStep | null = null;
  if (user) {
    const probe = await getRequiredAuthStep();
    if (probe.status === "ok") {
      requiredAuthStep = probe.step;
    }
  }

  const entry = resolveLoginEntryStep({
    urlStep,
    hasSession: Boolean(user),
    trust,
    forceLogin,
    requiredAuthStep,
    redirectUri: safeRedirectUri,
  });

  if (entry.kind === "redirect") {
    redirect(entry.redirectTo);
  }

  if (entry.step === "passkey-signin" && urlStep !== "passkey-signin") {
    redirect(
      buildAuthLoginPath({
        redirectUri: safeRedirectUri,
        forceLogin,
        step: "passkey-signin",
        error: authError,
      })
    );
  }

  return (
    <LoginClient
      initialStep={entry.step}
      initialTrustedUserId={entry.trustedUserId}
      initialError={initialError || undefined}
    />
  );
}
