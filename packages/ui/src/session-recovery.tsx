"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect } from "react";

import { redirectToLoginOnce, triggerHardLogoutOnce } from "./auth-navigation";
import {
  getAuthProbeBlockRemainingMs,
  getUserSingleflight,
} from "./auth-session-singleflight";

/**
 * Invisible component that rechecks Supabase auth session state after
 * tab suspend/resume on Safari iOS (and similar browsers).
 *
 * When a tab is suspended, JavaScript timers are paused, which means
 * Supabase's auto-refresh timer may not fire before the access token
 * expires. This component listens for visibility changes and performs
 * a session check; in required mode, explicit auth intent drives redirect
 * behavior (login-first, hard logout only for terminal auth states), while
 * transient failures are tolerated first.
 */
type SessionRecoveryMode = "optional" | "required";
const MIN_VISIBILITY_RECHECK_INTERVAL_MS = 5_000;

/** Props for SessionRecovery component. */
interface SessionRecoveryProps {
  mode?: SessionRecoveryMode;
}

/** Rechecks auth session after visibility changes. */
export function SessionRecovery({ mode = "required" }: SessionRecoveryProps) {
  useEffect(() => {
    const supabase = createBrowserClient();
    let transientFailureCount = 0;
    let ambiguousFailureCount = 0;
    let mounted = true;
    let lastVisibilityProbeAt = 0;

    const canRedirect = mode === "required";

    const recoverSession = async (source: "mount" | "visibility") => {
      if (!mounted) {
        return;
      }

      // Keep optional mode non-invasive on initial page load.
      if (mode === "optional" && source === "mount") {
        return;
      }

      const { data, error } = await getUserSingleflight(supabase, {
        cooldownMs: 1_500,
      });
      if (data.user && !error) {
        transientFailureCount = 0;
        ambiguousFailureCount = 0;
        return;
      }

      if (!canRedirect) {
        return;
      }

      const intent = classifyActionAuthError(error?.message ?? null);
      if (intent === "hard_logout") {
        triggerHardLogoutOnce(window.location.href, "session-recovery");
        return;
      }

      if (intent === "login") {
        // Avoid immediate redirect loops right after returning from auth.
        // The server may already have a valid session, while the browser
        // Supabase client can take a moment to stabilize before getUser().
        // We only force a login redirect on visibility rechecks.
        if (source === "mount") {
          return;
        }
        redirectToLoginOnce(window.location.href, "session-recovery");
        return;
      }

      // Ambiguous no-user/no-error checks are often transient on resume.
      if (!data.user && !error) {
        ambiguousFailureCount += 1;
        if (ambiguousFailureCount >= 3) {
          redirectToLoginOnce(window.location.href, "session-recovery");
        }
        return;
      }

      // Ignore initial transient failures to avoid delayed route bounce-backs.
      transientFailureCount += 1;
      if (transientFailureCount < 3) {
        return;
      }
    };

    /** Refresh auth state when tab visibility returns. */
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();
      if (
        now - lastVisibilityProbeAt < MIN_VISIBILITY_RECHECK_INTERVAL_MS ||
        getAuthProbeBlockRemainingMs() > 0
      ) {
        return;
      }

      lastVisibilityProbeAt = now;
      void recoverSession("visibility");
    }

    // First-visit recovery: refresh auth state on mount as well.
    void recoverSession("mount");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
