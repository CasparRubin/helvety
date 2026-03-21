import type { RequiredAuthStep } from "@/lib/auth-step";

/** Result of deciding how to land an authenticated user on the default email step. */
type AuthenticatedEmailBootstrapAction =
  | { kind: "redirect"; href: string }
  | { kind: "set_step"; step: "encryption-setup" | "passkey-signin" };

/**
 * When the user already has a Supabase session and opens `/login` on the email
 * step, choose either a passkey sub-step or an immediate redirect.
 *
 * Passkey sign-in is skipped (redirect to app) unless `force_login` is set, so
 * users who just completed passkey registration are not forced through a second
 * WebAuthn ceremony when revisiting login with an active session.
 */
export function resolveAuthenticatedEmailBootstrap(options: {
  requiredStep: RequiredAuthStep;
  forceLogin: boolean;
  redirectUri: string | null;
  homeUrl: string;
}): AuthenticatedEmailBootstrapAction {
  const { requiredStep, forceLogin, redirectUri, homeUrl } = options;

  if (requiredStep === "encryption-setup") {
    return { kind: "set_step", step: "encryption-setup" };
  }

  if (requiredStep === "passkey-signin") {
    if (!forceLogin) {
      return { kind: "redirect", href: redirectUri ?? homeUrl };
    }
    return { kind: "set_step", step: "passkey-signin" };
  }

  const _exhaustive: never = requiredStep;
  return _exhaustive;
}
