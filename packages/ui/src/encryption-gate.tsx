"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { onKeyEvent } from "@helvety/shared/crypto/key-storage";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { redirectToLoginOnce, triggerHardLogoutOnce } from "./auth-navigation";

import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

/**
 * Server actions that EncryptionGate needs injected by the consuming app.
 */
interface EncryptionGateActions {
  getEncryptionParams: () => Promise<
    ActionResponse<{
      type: "passkey" | null;
      passkeyParams?: UserPasskeyParams;
    }>
  >;
}

/** Props for the shared EncryptionGate component */
interface EncryptionGateProps {
  userId: string;
  children: ReactNode;
  actions: EncryptionGateActions;
}

/** Encryption gate status states */
type EncryptionStatus = "loading" | "needs_login" | "needs_logout" | "unlocked";
/** Redirect intent derived from encryption/auth checks before rendering. */
type RedirectIntent = "unknown" | "login" | "logout" | "none";

/**
 * Gate component that requires encryption setup/unlock in this UI flow before
 * rendering children. Unlock/setup is completed in `/auth`; when the user must
 * return to auth, navigation uses `redirectToLoginOnce` with `force_login` so the
 * login UI is not skipped when a session still exists locally. Trusted devices may
 * skip email OTP but still require passkey sign-in before unlock.
 */
export function EncryptionGate({
  userId,
  children,
  actions,
}: EncryptionGateProps) {
  const { getEncryptionParams } = actions;

  const {
    isUnlocked,
    isLoading: contextLoading,
    checkEncryptionState,
    lockEncryption,
    unlockedForUserId,
    error: contextError,
  } = useEncryptionContext();

  const alreadyUnlocked = isUnlocked && unlockedForUserId === userId;

  const [redirectIntent, setRedirectIntent] =
    useState<RedirectIntent>("unknown");
  const redirectingRef = useRef(false);

  /** When locked, treat stale `"none"` from a prior unlock as unknown until checks finish. */
  const resolvedRedirectIntent: RedirectIntent = alreadyUnlocked
    ? "none"
    : redirectIntent === "none"
      ? "unknown"
      : redirectIntent;

  useEffect(() => {
    if (alreadyUnlocked || redirectingRef.current) {
      return;
    }

    let cancelled = false;

    /**
     * Fetch encryption params and classify explicit auth intent.
     * Non-terminal/context failures fall back to login rather than hard logout.
     */
    const runStateCheck = () => {
      if (redirectingRef.current) return;
      void checkEncryptionState(userId)
        .then(() => {
          if (cancelled) return null;
          return getEncryptionParams();
        })
        .then((result) => {
          if (cancelled || !result) return;

          if (!result.success) {
            const intent = classifyActionAuthError(result.error);
            if (intent === "hard_logout") {
              if (unlockedForUserId) {
                void lockEncryption(unlockedForUserId);
              }
              setRedirectIntent("logout");
            } else {
              setRedirectIntent("login");
            }
            return;
          }

          // This app never unlocks in-place. If we are not already unlocked,
          // return to centralized auth flow without forcing global logout.
          setRedirectIntent(alreadyUnlocked ? "none" : "login");
        })
        .catch(() => {
          if (cancelled) return;
          setRedirectIntent("login");
        });
    };

    runStateCheck();
    return () => {
      cancelled = true;
    };
  }, [
    userId,
    checkEncryptionState,
    alreadyUnlocked,
    getEncryptionParams,
    unlockedForUserId,
    lockEncryption,
  ]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (redirectingRef.current) return;
      const sessionUserId = session?.user?.id ?? null;
      if (
        unlockedForUserId &&
        sessionUserId !== null &&
        sessionUserId !== unlockedForUserId
      ) {
        void lockEncryption(unlockedForUserId);
        setRedirectIntent("logout");
      }
      if (!session && event === "SIGNED_OUT") {
        if (unlockedForUserId) void lockEncryption(unlockedForUserId);
        setRedirectIntent("login");
      }
    });
    return () => subscription.unsubscribe();
  }, [unlockedForUserId, lockEncryption]);

  useEffect(() => {
    return onKeyEvent((msg) => {
      if (msg.type === "keys-cleared" && unlockedForUserId) {
        void lockEncryption(unlockedForUserId);
        setRedirectIntent("login");
      }
      if (msg.type === "master-key-deleted" && unlockedForUserId) {
        if (msg.userId === unlockedForUserId) {
          void lockEncryption(unlockedForUserId);
          setRedirectIntent("login");
        }
      }
    });
  }, [unlockedForUserId, lockEncryption]);

  const status: EncryptionStatus = useMemo(() => {
    const contextIntent = classifyActionAuthError(contextError);
    if (alreadyUnlocked) return "unlocked";
    if (contextLoading || resolvedRedirectIntent === "unknown")
      return "loading";
    if (
      resolvedRedirectIntent === "logout" ||
      contextIntent === "hard_logout"
    ) {
      return "needs_logout";
    }
    if (
      resolvedRedirectIntent === "login" ||
      contextIntent === "login" ||
      contextError
    ) {
      return "needs_login";
    }
    return "needs_login";
  }, [alreadyUnlocked, contextError, contextLoading, resolvedRedirectIntent]);

  useEffect(() => {
    if (redirectingRef.current) return;
    // Pass the current app URL as intent; auth-navigation builds /auth/login.
    // Avoid passing a prebuilt auth URL here to prevent nested redirect_uri loops.
    const destination =
      typeof window !== "undefined" ? window.location.href : undefined;

    if (status === "needs_logout") {
      redirectingRef.current = true;
      triggerHardLogoutOnce(destination, "encryption-gate");
      return;
    }

    if (status === "needs_login") {
      redirectingRef.current = true;
      const supabase = createBrowserClient();
      void supabase.auth.signOut({ scope: "local" }).finally(() => {
        redirectToLoginOnce(destination, "encryption-gate", {
          forceLogin: true,
        });
      });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (status === "needs_logout") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Signing out and redirecting to authentication...
          </p>
        </div>
      </div>
    );
  }

  if (status === "needs_login") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Redirecting to authentication...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
