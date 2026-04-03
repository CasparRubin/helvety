import { requiresE2eeBrowserUnlock } from "@helvety/shared/e2ee-app-paths";

import type { RequiredAuthStep } from "@/lib/auth-step";

/** Result of deciding how to land an authenticated user on the default email step. */
type AuthenticatedEmailBootstrapAction =
  | { kind: "redirect"; href: string }
  | { kind: "set_step"; step: "encryption-setup" | "passkey-signin" };

/**
 * When the user already has a Supabase session and opens `/login` on the email
 * step, choose either a passkey sub-step or an immediate redirect.
 *
 * Passkey sign-in is skipped (redirect to app) unless `force_login` is set or
 * the destination is an E2EE app (notes/tasks/contacts), which need a browser
 * passkey touch for local crypto unlock.
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
      const target = redirectUri ?? homeUrl;
      if (!requiresE2eeBrowserUnlock(target)) {
        return { kind: "redirect", href: target };
      }
    }
    return { kind: "set_step", step: "passkey-signin" };
  }

  const _exhaustive: never = requiredStep;
  return _exhaustive;
}
