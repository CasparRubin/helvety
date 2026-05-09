import type {
  AuthStep,
  AuthStepperMode,
} from "@/components/encryption-stepper";

/** URL / UI step for the login page (matches `useLoginFlow` state). */
export type LoginStep =
  | "email"
  | "verify-code"
  | "passkey-signin"
  | "encryption-setup";

/**
 * After OTP (or session bootstrap), whether the user goes straight to passkey
 * sign-in or completed setup first - drives 3- vs 4-step stepper.
 */
export type PostOtpPasskeyPath = "direct_signin" | "setup_then_signin" | null;

/** Maps login UI step to the stepper’s current `AuthStep`. */
export function resolveLoginCurrentAuthStep(step: LoginStep): AuthStep {
  switch (step) {
    case "email":
      return "email";
    case "verify-code":
      return "verify_code";
    case "passkey-signin":
      return "sign_in";
    case "encryption-setup":
      return "create_passkey";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

/** Chooses stepper layout (4 steps before OTP; 3 or 4 after, depending on path). */
export function resolveLoginStepperMode(
  step: LoginStep,
  postOtpPasskeyPath: PostOtpPasskeyPath
): AuthStepperMode {
  switch (step) {
    case "email":
    case "verify-code":
      return "four_before_otp";
    case "encryption-setup":
      return "four_full";
    case "passkey-signin":
      return postOtpPasskeyPath === "setup_then_signin"
        ? "four_full"
        : "three_skip_setup";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}
