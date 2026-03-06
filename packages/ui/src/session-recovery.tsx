"use client";

import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect } from "react";

import { triggerHardLogoutOnce } from "./auth-navigation";

/**
 * Invisible component that rechecks Supabase auth session state after
 * tab suspend/resume on Safari iOS (and similar browsers).
 *
 * When a tab is suspended, JavaScript timers are paused, which means
 * Supabase's auto-refresh timer may not fire before the access token
 * expires. This component listens for visibility changes and performs
 * a session check; in required mode, terminal auth states trigger a
 * deduplicated hard logout, while transient failures are tolerated first.
 */
type SessionRecoveryMode = "optional" | "required";

/** Props for SessionRecovery component. */
interface SessionRecoveryProps {
  mode?: SessionRecoveryMode;
}

/** Rechecks auth session after visibility changes. */
export function SessionRecovery({ mode = "required" }: SessionRecoveryProps) {
  useEffect(() => {
    const supabase = createBrowserClient();
    let transientFailureCount = 0;
    let mounted = true;

    const canRedirect = mode === "required";

    const recoverSession = async () => {
      if (!mounted || !canRedirect) {
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (data.user && !error) {
        transientFailureCount = 0;
        return;
      }

      const message = error?.message ?? null;
      if (!message && !data.user) {
        triggerHardLogoutOnce(window.location.href, "session-recovery");
        return;
      }

      if (shouldForceHardLogout(message)) {
        triggerHardLogoutOnce(window.location.href, "session-recovery");
        return;
      }

      // Ignore the first transient auth check failure to avoid bounce-backs.
      transientFailureCount += 1;
      if (transientFailureCount < 2) {
        return;
      }
    };

    /** Refresh auth state when tab visibility returns. */
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }
      void recoverSession();
    }

    // First-visit recovery: refresh auth state on mount as well.
    void recoverSession();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
