import { buildAuthLoginPath } from "@/lib/login-entry";

import type { LoginStep } from "@/lib/login-flow-stepper";

/** Options for {@link syncLoginUrlStep}. */
export type SyncLoginUrlStepOptions = {
  redirectUri: string | null;
  forceLogin: boolean;
  error?: string;
};

/**
 * Updates the browser URL query to reflect the current login step without
 * navigation (preserves client React state during post-OTP transitions).
 */
export function syncLoginUrlStep(
  step: LoginStep,
  options: SyncLoginUrlStepOptions
): void {
  if (typeof window === "undefined") {
    return;
  }

  const path = buildAuthLoginPath({
    redirectUri: options.redirectUri,
    forceLogin: options.forceLogin,
    step,
    error: options.error,
  });

  const queryIndex = path.indexOf("?");
  const nextSearch = queryIndex === -1 ? "" : path.slice(queryIndex);
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${nextSearch}`
  );
}
