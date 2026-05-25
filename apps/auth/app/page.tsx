import { getAuthUser } from "@helvety/shared/auth-retry";
import { urls } from "@helvety/shared/config";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";
import { createServerClient } from "@helvety/shared/supabase/server";
import { redirect } from "next/navigation";

import { buildAuthLoginPath, resolveLoginEntryStep } from "@/lib/login-entry";

import { getDeviceTrustStatus } from "./actions/device-trust-actions";

/**
 * Root page - redirects to login with any redirect_uri preserved.
 * Entry step is resolved server-side (device trust → passkey-first when applicable).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const params = await searchParams;
  const rawRedirectUri = params.redirect_uri;
  const safeRedirectUri = getSafeRedirectUri(rawRedirectUri, null);
  const redirectTarget = safeRedirectUri ?? urls.home;

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

  const entry = resolveLoginEntryStep({
    urlStep: null,
    hasSession: Boolean(user),
    trust,
    forceLogin: false,
    requiredAuthStep: null,
    redirectUri: redirectTarget,
  });

  if (entry.kind === "redirect") {
    redirect(entry.redirectTo);
  }

  redirect(
    buildAuthLoginPath({
      redirectUri: redirectTarget,
      step: entry.step,
    })
  );
}
