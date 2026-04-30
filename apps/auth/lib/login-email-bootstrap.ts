import type { RequiredAuthStep } from "@/lib/auth-step";

/** Result of deciding how to land an authenticated user on the default email step. */
type AuthenticatedEmailBootstrapAction = {
  kind: "set_step";
  step: RequiredAuthStep;
};

/**
 * When the user already has a Supabase session and opens `/login` on the email
 * step, resolve the passkey/encryption sub-step that still needs completion.
 * All app entry points use the same passkey-aware flow.
 */
export function resolveAuthenticatedEmailBootstrap(options: {
  requiredStep: RequiredAuthStep;
}): AuthenticatedEmailBootstrapAction {
  const { requiredStep } = options;

  if (requiredStep === "encryption-setup") {
    return { kind: "set_step", step: "encryption-setup" };
  }

  if (requiredStep === "passkey-signin") {
    return { kind: "set_step", step: "passkey-signin" };
  }

  const _exhaustive: never = requiredStep;
  return _exhaustive;
}
