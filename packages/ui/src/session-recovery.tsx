"use client";

import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect } from "react";

import { forceHardLogout } from "./hard-logout";

/**
 * Invisible component that rechecks Supabase auth session state after
 * tab suspend/resume on Safari iOS (and similar browsers).
 *
 * When a tab is suspended, JavaScript timers are paused, which means
 * Supabase's auto-refresh timer may not fire before the access token
 * expires. This component listens for visibility changes and performs
 * a session check; in required mode, any invalid session state triggers a
 * centralized hard logout.
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
    let redirecting = false;

    const canRedirect = mode === "required";

    const recoverSession = async () => {
      if (redirecting) {
        return;
      }
      if (!canRedirect) {
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (data.user && !error) {
        return;
      }

      if (!redirecting) {
        redirecting = true;
        await forceHardLogout(window.location.href);
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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
