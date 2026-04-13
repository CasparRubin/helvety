"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { getLoginUrl } from "@helvety/shared/auth-redirect";

import { forceHardLogout } from "./hard-logout";

/** Supported auth navigation types emitted by the orchestrator. */
type NavigationType = "login" | "hard_logout";
/** Call-site identifier used for redirect observability. */
type NavigationSource = string;
/** Optional route-freshness metadata for async redirect decisions. */
interface AuthNavigationOptions {
  expectedRoute?: string;
  requestStartedAt?: number;
  /** When true, appends `force_login=1` so login does not auto-skip passkey. */
  forceLogin?: boolean;
}

const NAVIGATION_COOLDOWN_MS = 1500;
let globalRedirectActive = false;
let hardLogoutInFlight = false;
let lastNavigationKey = "";
let lastNavigationAt = 0;

/** Test-only: reset the global redirect lock between test runs. */
export function resetGlobalRedirectLockForTests(): void {
  globalRedirectActive = false;
  hardLogoutInFlight = false;
  lastNavigationKey = "";
  lastNavigationAt = 0;
}

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
  deduped: boolean,
  options?: AuthNavigationOptions
) {
  if (typeof window === "undefined") {
    return;
  }
  const currentRoute = window.location.href;
  const routeMatched =
    options?.expectedRoute === undefined ||
    options.expectedRoute === currentRoute;
  const requestAgeMs =
    options?.requestStartedAt === undefined
      ? undefined
      : Date.now() - options.requestStartedAt;
  window.dispatchEvent(
    new CustomEvent("helvety:auth-navigation", {
      detail: {
        type,
        source,
        target,
        deduped,
        routeMatched,
        expectedRoute: options?.expectedRoute,
        currentRoute,
        requestAgeMs,
        timestamp: Date.now(),
      },
    })
  );
}

/** Ensures redirect execution still belongs to the originating route. */
function isExpectedRouteStillActive(expectedRoute?: string): boolean {
  if (typeof window === "undefined" || !expectedRoute) {
    return true;
  }
  return window.location.href === expectedRoute;
}

/** Performs an idempotent login redirect for auth-required states. */
export function redirectToLoginOnce(
  redirectUri?: string,
  source: NavigationSource = "unknown",
  options?: AuthNavigationOptions
): boolean {
  if (globalRedirectActive) {
    emitAuthNavigationEvent(
      "login",
      source,
      redirectUri ?? "current",
      true,
      options
    );
    return true;
  }
  if (!isExpectedRouteStillActive(options?.expectedRoute)) {
    emitAuthNavigationEvent(
      "login",
      source,
      redirectUri ?? "current",
      true,
      options
    );
    return false;
  }
  const target =
    redirectUri ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const loginUrl = getLoginUrl(target, {
    forceLogin: options?.forceLogin === true,
  });
  const dedupeKey = buildNavigationKey("login", loginUrl);
  if (shouldDeduplicateNavigation(dedupeKey)) {
    emitAuthNavigationEvent("login", source, loginUrl, true, options);
    return true;
  }
  emitAuthNavigationEvent("login", source, loginUrl, false, options);
  globalRedirectActive = true;
  window.location.replace(loginUrl);
  return true;
}

/** Performs an idempotent hard-logout redirect for terminal auth states. */
export function triggerHardLogoutOnce(
  redirectUri?: string,
  source: NavigationSource = "unknown",
  options?: AuthNavigationOptions
): boolean {
  if (globalRedirectActive) {
    emitAuthNavigationEvent(
      "hard_logout",
      source,
      redirectUri ?? "current",
      true,
      options
    );
    return true;
  }
  if (!isExpectedRouteStillActive(options?.expectedRoute)) {
    emitAuthNavigationEvent(
      "hard_logout",
      source,
      redirectUri ?? "current",
      true,
      options
    );
    return false;
  }
  const target =
    redirectUri ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const dedupeKey = buildNavigationKey("hard_logout", target ?? "current");
  if (hardLogoutInFlight || shouldDeduplicateNavigation(dedupeKey)) {
    emitAuthNavigationEvent(
      "hard_logout",
      source,
      target ?? "current",
      true,
      options
    );
    return true;
  }

  emitAuthNavigationEvent(
    "hard_logout",
    source,
    target ?? "current",
    false,
    options
  );
  globalRedirectActive = true;
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
  source: NavigationSource = "unknown",
  options?: AuthNavigationOptions
): boolean {
  const intent = classifyActionAuthError(rawError);
  if (intent === "hard_logout") {
    return triggerHardLogoutOnce(redirectUri, source, options);
  }
  if (intent === "login") {
    return redirectToLoginOnce(redirectUri, source, options);
  }
  return false;
}
