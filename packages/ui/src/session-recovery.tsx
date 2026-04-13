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
 * tab suspend/resume.
 *
 * Fail-closed: one getUser() call on visibility change.
 * - required mode: no user = immediate redirect (hard logout or login).
 * - optional mode: no redirect; the call triggers Supabase's internal
 *   token refresh and onAuthStateChange updates the navbar.
 * - mount: always skipped (the server already ran its auth checks).
 */
/** Whether the component guards a required-auth or optional-auth route. */
type SessionRecoveryMode = "optional" | "required";
const MIN_VISIBILITY_RECHECK_INTERVAL_MS = 5_000;

/** Props for the SessionRecovery component. */
interface SessionRecoveryProps {
  mode?: SessionRecoveryMode;
}

/** Invisible client component that rechecks auth on tab resume. */
export function SessionRecovery({ mode = "required" }: SessionRecoveryProps) {
  useEffect(() => {
    const supabase = createBrowserClient();
    let mounted = true;
    let lastVisibilityProbeAt = 0;

    const canRedirect = mode === "required";

    const recoverSession = async () => {
      if (!mounted) {
        return;
      }

      const { data, error } = await getUserSingleflight(supabase, {
        cooldownMs: 1_500,
      });

      if (data.user && !error) {
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

      redirectToLoginOnce(window.location.href, "session-recovery");
    };

    /** Re-probes auth when the tab becomes visible again. */
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
      void recoverSession();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode]);

  return null;
}
