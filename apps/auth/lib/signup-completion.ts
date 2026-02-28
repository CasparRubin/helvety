"use client";

const SIGNUP_PASSKEY_COMPLETED_KEY = "helvety.signupPasskeyCompleted";

/**
 * Marks that signup passkey setup just completed in this tab.
 * The next login bootstrap can consume this to skip one redundant passkey step.
 */
export function markSignupPasskeyCompleted(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_PASSKEY_COMPLETED_KEY, "1");
}

/**
 * Returns true once when the signup-complete marker is present.
 */
export function consumeSignupPasskeyCompleted(): boolean {
  if (typeof window === "undefined") return false;
  const wasCompleted =
    window.sessionStorage.getItem(SIGNUP_PASSKEY_COMPLETED_KEY) === "1";
  if (wasCompleted) {
    window.sessionStorage.removeItem(SIGNUP_PASSKEY_COMPLETED_KEY);
  }
  return wasCompleted;
}
