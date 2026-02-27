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
 * a session check; in required mode, if no valid user is returned and errors are
 * not transient, it redirects to /auth login.
 */
type SessionRecoveryMode = "optional" | "required";

/** Props for SessionRecovery component. */
interface SessionRecoveryProps {
  mode?: SessionRecoveryMode;
}

/** Backoff delays for transient Supabase auth/network errors. */
const RETRY_DELAYS_MS = [300, 900] as const;

/** Rechecks auth session after visibility changes with transient-error tolerance. */
export function SessionRecovery({ mode = "required" }: SessionRecoveryProps) {
  useEffect(() => {
    const supabase = createBrowserClient();
    let redirecting = false;

    const canRedirect = mode === "required";

    /** Small helper for transient auth retry backoff. */
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const recoverSession = async () => {
      if (redirecting) {
        return;
      }

      let shouldRetry = false;
      for (const delay of RETRY_DELAYS_MS) {
        const { data, error } = await supabase.auth.getUser();
        if (data.user) {
          return;
        }

        if (!error) {
          // Clear unauthenticated state (no transient error): safe to redirect on protected apps.
          if (canRedirect) {
            redirecting = true;
            window.location.href = getLoginUrl(window.location.href);
          }
          return;
        }

        shouldRetry = true;
        await sleep(delay);
      }

      // Persistent network/auth errors should not force-login users.
      if (shouldRetry || !canRedirect) {
        return;
      }

      if (canRedirect) {
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
