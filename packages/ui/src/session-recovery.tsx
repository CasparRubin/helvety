"use client";

import { createBrowserClient } from "@helvety/shared/supabase/client";
import { useEffect } from "react";

/**
 * Invisible component that recovers the Supabase auth session after
 * Safari iOS (and similar browsers) suspend and resume the tab.
 *
 * When a tab is suspended, JavaScript timers are paused, which means
 * Supabase's auto-refresh timer may not fire before the access token
 * expires. This component listens for the page becoming visible again
 * and proactively triggers a session check/refresh.
 */
export function SessionRecovery() {
  useEffect(() => {
    const supabase = createBrowserClient();

    const recoverSession = () => {
      void supabase.auth.getUser();
    };

    /** Refresh auth state when tab visibility returns. */
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }
      recoverSession();
    }

    // First-visit recovery: refresh auth state on mount as well.
    recoverSession();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
