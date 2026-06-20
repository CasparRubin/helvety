import { urls } from "@helvety/shared/config";
import { getSafeRedirectUri } from "@helvety/shared/redirect-validation";

import { resolveAuthenticatedEmailBootstrap } from "@/lib/login-email-bootstrap";

import type { RequiredAuthStep } from "@/lib/auth-step";
import type { LoginStep } from "@/lib/login-flow-stepper";

/** Device-trust probe input for login entry resolution. */
type LoginEntryTrust = {
  trusted: boolean;
  userId: string | null;
};

/** Inputs for {@link resolveLoginEntryStep}. */
type ResolveLoginEntryInput = {
  urlStep: LoginStep | null;
  hasSession: boolean;
  trust: LoginEntryTrust;
  forceLogin: boolean;
  requiredAuthStep: RequiredAuthStep | null;
  redirectUri: string | null;
};

/** Resolved login UI step for the client shell. */
type LoginEntryStepResult = {
  kind: "step";
  step: LoginStep;
  trustedUserId: string | null;
};

/** Resolved redirect away from the login UI. */
type LoginEntryRedirectResult = {
  kind: "redirect";
  redirectTo: string;
};

/** Result of {@link resolveLoginEntryStep}. */
type LoginEntryResult = LoginEntryStepResult | LoginEntryRedirectResult;

const LOGIN_STEPS: readonly LoginStep[] = [
  "email",
  "verify-code",
  "passkey-signin",
  "encryption-setup",
];

/** Returns true when `value` is a known login flow step. */
function isLoginStep(value: string | null | undefined): value is LoginStep {
  return (
    value !== null &&
    value !== undefined &&
    (LOGIN_STEPS as readonly string[]).includes(value)
  );
}

/**
 * Canonical login entry resolver for `/auth/login` and auth redirects.
 * UX only — does not create sessions or grant authorization.
 */
export function resolveLoginEntryStep(
  input: ResolveLoginEntryInput
): LoginEntryResult {
  const {
    urlStep,
    hasSession,
    trust,
    forceLogin,
    requiredAuthStep,
    redirectUri,
  } = input;

  const safeRedirect = getSafeRedirectUri(redirectUri, urls.home) ?? urls.home;

  // Rule 5: already signed in and login not forced → leave login UI.
  if (hasSession && !forceLogin && requiredAuthStep === null) {
    return { kind: "redirect", redirectTo: safeRedirect };
  }

  // Rule 4: session present but login forced or auth steps remain.
  if (hasSession && forceLogin) {
    if (requiredAuthStep !== null) {
      const bootstrap = resolveAuthenticatedEmailBootstrap({
        requiredStep: requiredAuthStep,
      });
      return {
        kind: "step",
        step: bootstrap.step,
        trustedUserId: null,
      };
    }
    return {
      kind: "step",
      step: "passkey-signin",
      trustedUserId: null,
    };
  }

  if (hasSession && requiredAuthStep !== null) {
    const bootstrap = resolveAuthenticatedEmailBootstrap({
      requiredStep: requiredAuthStep,
    });
    return {
      kind: "step",
      step: bootstrap.step,
      trustedUserId: null,
    };
  }

  // Rule 1: explicit step in URL (user/bookmark/back navigation).
  if (isLoginStep(urlStep)) {
    if (urlStep === "encryption-setup" && !hasSession) {
      return { kind: "step", step: "email", trustedUserId: null };
    }
    if (urlStep === "passkey-signin" && !hasSession && !trust.trusted) {
      return { kind: "step", step: "email", trustedUserId: null };
    }
    return {
      kind: "step",
      step: urlStep,
      trustedUserId:
        urlStep === "passkey-signin" && trust.trusted ? trust.userId : null,
    };
  }

  // Rule 2: trusted device without session → passkey-first.
  if (!hasSession && trust.trusted && trust.userId) {
    return {
      kind: "step",
      step: "passkey-signin",
      trustedUserId: trust.userId,
    };
  }

  // Rule 3: default untrusted entry.
  return { kind: "step", step: "email", trustedUserId: null };
}

/**
 * Whether the login server gate should redirect to canonical `?step=passkey-signin`.
 * Only for trusted-device entry without a session; post-OTP sessions sync the URL
 * on the client instead to avoid remounting the login shell.
 */
export function shouldCanonicalizeTrustedPasskeyLoginUrl(options: {
  entryStep: LoginStep;
  urlStep: LoginStep | null;
  hasSession: boolean;
}): boolean {
  return (
    options.entryStep === "passkey-signin" &&
    options.urlStep !== "passkey-signin" &&
    !options.hasSession
  );
}

/** Build `/auth/login` path + query (relative to auth zone). */
export function buildAuthLoginPath(options: {
  redirectUri?: string | null;
  error?: string;
  forceLogin?: boolean;
  step?: LoginStep;
}): string {
  const safeRedirect =
    getSafeRedirectUri(options.redirectUri ?? null, urls.home) ?? urls.home;
  const params = new URLSearchParams({
    redirect_uri: safeRedirect,
  });
  if (options.forceLogin) {
    params.set("force_login", "1");
  }
  if (options.error) {
    params.set("error", options.error);
  }
  if (options.step) {
    params.set("step", options.step);
  }
  return `/login?${params.toString()}`;
}

/** Build absolute auth login URL (for redirects from callback routes). */
export function buildAuthLoginUrl(options: {
  redirectUri?: string | null;
  error?: string;
  forceLogin?: boolean;
  step?: LoginStep;
}): string {
  return `${urls.auth}${buildAuthLoginPath(options)}`;
}
