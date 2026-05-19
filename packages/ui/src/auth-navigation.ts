"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { toast } from "sonner";

import { forceHardLogout } from "./hard-logout";

/** Supported auth navigation types emitted by the orchestrator. */
type NavigationType = "login" | "hard_logout";
/** Call-site identifier used for redirect observability. */
type NavigationSource = string;
/** Optional route-freshness metadata for async redirect decisions. */
interface AuthNavigationOptions {
  expectedRoute?: string;
  requestStartedAt?: number;
  /** When true, appends `force_login=1` to enforce an explicit re-auth cycle. */
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

/**
 * Low-level auth redirect helper for hook errors. Prefer
 * {@link reportE2eeHookError} and {@link reportE2eeActionFailure} in E2EE hooks
 * (they add toast/state handling). Uses the same redirect defaults as
 * `handleAuthErrorNavigation` with a stable `source` for telemetry.
 */
export function triggerE2eeHookAuthErrorNavigation(
  source: NavigationSource,
  rawError?: string | null,
  options?: AuthNavigationOptions & {
    redirectUri?: string;
  }
): boolean {
  return handleAuthErrorNavigation(
    rawError,
    options?.redirectUri ??
      (typeof window !== "undefined" ? window.location.href : ""),
    source,
    {
      expectedRoute: options?.expectedRoute,
      requestStartedAt: options?.requestStartedAt,
    }
  );
}

/** Normalizes unknown hook errors to a user-visible message. */
export function getE2eeHookErrorMessage(
  err: unknown,
  fallback: string
): string {
  return err instanceof Error ? err.message : fallback;
}

/** Shared options for E2EE hook error reporting helpers. */
export interface ReportE2eeHookErrorOptions {
  source: NavigationSource;
  fallback: string;
  setError?: (error: string | null) => void;
  expectedRoute?: string;
  requestStartedAt?: number;
  redirectUri?: string;
}

/**
 * Handles E2EE hook catch blocks: auth redirect when applicable, otherwise
 * optional state + toast. Returns true when auth navigation consumed the error.
 */
export function reportE2eeHookError(
  err: unknown,
  options: ReportE2eeHookErrorOptions
): boolean {
  const message = getE2eeHookErrorMessage(err, options.fallback);
  if (
    triggerE2eeHookAuthErrorNavigation(options.source, message, {
      expectedRoute: options.expectedRoute,
      requestStartedAt: options.requestStartedAt,
      redirectUri: options.redirectUri,
    })
  ) {
    return true;
  }
  options.setError?.(message);
  toast.error(message, { duration: TOAST_DURATIONS.ERROR });
  return false;
}

/**
 * Handles failed E2EE server-action responses in client hooks.
 * Returns true when auth navigation consumed the error.
 */
export function reportE2eeActionFailure(
  error: string | null | undefined,
  options: ReportE2eeHookErrorOptions
): boolean {
  const message = error ?? options.fallback;
  if (
    triggerE2eeHookAuthErrorNavigation(options.source, message, {
      expectedRoute: options.expectedRoute,
      requestStartedAt: options.requestStartedAt,
      redirectUri: options.redirectUri,
    })
  ) {
    return true;
  }
  options.setError?.(message);
  toast.error(message, { duration: TOAST_DURATIONS.ERROR });
  return false;
}
