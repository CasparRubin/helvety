"use client";

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { getLoginUrl } from "@helvety/shared/auth-redirect";
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
export interface EncryptionGateActions {
  getEncryptionParams: () => Promise<
    ActionResponse<{
      type: "passkey" | null;
      passkeyParams?: UserPasskeyParams;
    }>
  >;
}

/** Props for the shared EncryptionGate component */
export interface EncryptionGateProps {
  userId: string;
  children: ReactNode;
  actions: EncryptionGateActions;
}

/** Encryption gate status states */
type EncryptionStatus = "loading" | "needs_login" | "needs_logout" | "unlocked";

/** Build the auth URL for a normal login flow (with redirect back). */
function getAuthLoginUrl(): string {
  return getLoginUrl(
    typeof window !== "undefined" ? window.location.href : undefined
  );
}

/**
 * Gate component that requires encryption setup/unlock in this UI flow before
 * rendering children. Any unlock/setup requirement is handled in /auth.
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

  const [hasCheckedParams, setHasCheckedParams] = useState(alreadyUnlocked);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsLogout, setNeedsLogout] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (alreadyUnlocked) {
      return;
    }

    let cancelled = false;

    /**
     * Fetch encryption params and classify explicit auth intent.
     * Non-terminal/context failures fall back to login rather than hard logout.
     */
    const runStateCheck = () => {
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
              setNeedsLogout(true);
            } else {
              setNeedsLogin(true);
            }
            setHasCheckedParams(true);
            return;
          }

          // This app never unlocks in-place. If we are not already unlocked,
          // return to centralized auth flow without forcing global logout.
          setNeedsLogin(!alreadyUnlocked);
          setHasCheckedParams(true);
        })
        .catch(() => {
          if (cancelled) return;
          setNeedsLogin(true);
          setHasCheckedParams(true);
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
      const sessionUserId = session?.user?.id ?? null;
      if (
        unlockedForUserId &&
        sessionUserId !== null &&
        sessionUserId !== unlockedForUserId
      ) {
        void lockEncryption(unlockedForUserId);
        setNeedsLogout(true);
      }
      if (!session && event === "SIGNED_OUT") {
        if (unlockedForUserId) void lockEncryption(unlockedForUserId);
        setNeedsLogin(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [unlockedForUserId, lockEncryption]);

  useEffect(() => {
    return onKeyEvent((msg) => {
      if (msg.type === "keys-cleared" && unlockedForUserId) {
        void lockEncryption(unlockedForUserId);
        setNeedsLogin(true);
      }
      if (msg.type === "master-key-deleted" && unlockedForUserId) {
        if (msg.userId === unlockedForUserId) {
          void lockEncryption(unlockedForUserId);
          setNeedsLogin(true);
        }
      }
    });
  }, [unlockedForUserId, lockEncryption]);

  const status: EncryptionStatus = useMemo(() => {
    const contextIntent = classifyActionAuthError(contextError);
    if (alreadyUnlocked) return "unlocked";
    if (contextLoading || !hasCheckedParams) return "loading";
    if (needsLogout || contextIntent === "hard_logout") return "needs_logout";
    if (needsLogin || contextIntent === "login" || Boolean(contextError)) {
      return "needs_login";
    }
    return "loading";
  }, [
    alreadyUnlocked,
    contextError,
    contextLoading,
    hasCheckedParams,
    needsLogin,
    needsLogout,
  ]);

  useEffect(() => {
    if (redirectingRef.current) return;

    if (status === "needs_logout") {
      redirectingRef.current = true;
      triggerHardLogoutOnce(getAuthLoginUrl(), "encryption-gate");
      return;
    }

    if (status === "needs_login") {
      redirectingRef.current = true;
      redirectToLoginOnce(getAuthLoginUrl(), "encryption-gate");
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
