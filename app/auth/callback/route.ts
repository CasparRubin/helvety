import { NextResponse } from "next/server";

import { getLoginUrl } from "@/lib/auth-redirect";
import { logger } from "@/lib/logger";
import { getSafeRelativePath } from "@/lib/redirect-validation";
import { createClient } from "@/lib/supabase/server";

import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Auth callback route for handling Supabase email verification and OAuth
 *
 * This route handles session establishment from email verification flows
 * and OAuth. Primary authentication now happens via auth.helvety.com using
 * OTP codes. This callback is used for account recovery, invite, and email
 * change confirmation links, as well as session establishment from
 * cross-subdomain cookies.
 *
 * Security: The `next` parameter is validated to prevent open redirect attacks.
 * Only relative paths starting with "/" are allowed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Validate next parameter to prevent open redirect attacks
  const next = getSafeRelativePath(searchParams.get("next"), "/");

  // Get auth service URL with redirect back to this app
  const authErrorUrl = getLoginUrl(origin);

  // Handle PKCE flow (code exchange)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    logger.error("Auth callback error (code exchange):", error);
    return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
  }

  // Handle token hash (email OTP verification link)
  // Supports all Supabase email types: magiclink, signup, recovery, invite, email_change
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    logger.error("Auth callback error (token hash):", error);
    return NextResponse.redirect(`${authErrorUrl}&error=auth_failed`);
  }

  // No valid auth params - redirect to auth service
  return NextResponse.redirect(`${authErrorUrl}&error=missing_params`);
}
