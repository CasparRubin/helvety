"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect } from "react";

/**
 * Invisible component that rechecks Supabase auth session state after
 * tab suspend/resume on Safari iOS (and similar browsers).
 *
 * When a tab is suspended, JavaScript timers are paused, which means
 * Supabase's auto-refresh timer may not fire before the access token
 * expires. This component listens for visibility changes and performs
 * a session check; if no valid user is returned, it redirects to /auth login.
 */
export function SessionRecovery() {
  useEffect(() => {
    const supabase = createBrowserClient();
    let redirecting = false;

    const recoverSession = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (redirecting) {
        return;
      }

      if (error || !data.user) {
        redirecting = true;
        window.location.href = getLoginUrl(window.location.href);
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
