"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { getLoginUrl } from "@helvety/shared/auth-redirect";

import { forceHardLogout } from "./hard-logout";

/** Supported auth navigation types emitted by the orchestrator. */
type NavigationType = "login" | "hard_logout";
/** Call-site identifier used for redirect observability. */
type NavigationSource = string;

const NAVIGATION_COOLDOWN_MS = 1500;
let hardLogoutInFlight = false;
let lastNavigationKey = "";
let lastNavigationAt = 0;

/** Returns true when a redirect should be deduplicated. */
function shouldDeduplicateNavigation(key: string): boolean {
  const now = Date.now();
  if (
    key === lastNavigationKey &&
    now - lastNavigationAt < NAVIGATION_COOLDOWN_MS
  ) {
    return true;
  }
  lastNavigationKey = key;
  lastNavigationAt = now;
  return false;
}

/** Builds a stable dedupe key for the redirect target. */
function buildNavigationKey(type: NavigationType, target: string): string {
  return `${type}:${target}`;
}

/** Emits redirect telemetry for debugging redirect races and loops. */
function emitAuthNavigationEvent(
  type: NavigationType,
  source: NavigationSource,
  target: string,
  deduped: boolean
) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("helvety:auth-navigation", {
      detail: { type, source, target, deduped, timestamp: Date.now() },
    })
  );
}

/** Performs an idempotent login redirect for auth-required states. */
export function redirectToLoginOnce(
  redirectUri?: string,
  source: NavigationSource = "unknown"
): boolean {
  const target =
    redirectUri ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const loginUrl = getLoginUrl(target);
  const dedupeKey = buildNavigationKey("login", loginUrl);
  if (shouldDeduplicateNavigation(dedupeKey)) {
    emitAuthNavigationEvent("login", source, loginUrl, true);
    return true;
  }
  emitAuthNavigationEvent("login", source, loginUrl, false);
  window.location.replace(loginUrl);
  return true;
}

/** Performs an idempotent hard-logout redirect for terminal auth states. */
export function triggerHardLogoutOnce(
  redirectUri?: string,
  source: NavigationSource = "unknown"
): boolean {
  const target =
    redirectUri ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const dedupeKey = buildNavigationKey("hard_logout", target ?? "current");
  if (hardLogoutInFlight || shouldDeduplicateNavigation(dedupeKey)) {
    emitAuthNavigationEvent("hard_logout", source, target ?? "current", true);
    return true;
  }

  emitAuthNavigationEvent("hard_logout", source, target ?? "current", false);
  hardLogoutInFlight = true;
  void forceHardLogout(target).finally(() => {
    hardLogoutInFlight = false;
  });
  return true;
}

/** Routes auth-related action errors to a single redirect authority. */
export function handleAuthErrorNavigation(
  rawError?: string | null,
  redirectUri?: string,
  source: NavigationSource = "unknown"
): boolean {
  const intent = classifyActionAuthError(rawError);
  if (intent === "hard_logout") {
    return triggerHardLogoutOnce(redirectUri, source);
  }
  if (intent === "login") {
    return redirectToLoginOnce(redirectUri, source);
  }
  return false;
}
