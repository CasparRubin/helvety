"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { CONTACT_EMAIL } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { onKeyEvent } from "@helvety/shared/crypto/key-storage";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { PRFKeyParams } from "@helvety/shared/crypto/types";
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
  userEmail: string;
  children: ReactNode;
  actions: EncryptionGateActions;
}

/** Encryption gate status states */
type EncryptionStatus =
  | "loading"
  | "needs_login"
  | "needs_setup"
  | "needs_unlock"
  | "unlocked"
  | "error";

const MAX_AUTO_RETRIES = 1;
const AUTO_RETRY_DELAY_MS = 1_000;

/** Build the auth URL for encryption setup, redirecting back to the current page. */
function getAuthSetupUrl(): string {
  const loginUrl = getLoginUrl(
    typeof window !== "undefined" ? window.location.href : undefined
  );
  const url = new URL(loginUrl);
  url.searchParams.set("step", "encryption-setup");
  return url.toString();
}

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
  userEmail: _userEmail,
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
  const [passkeyParams, setPasskeyParams] = useState<PRFKeyParams | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectingRef = useRef(false);

  const retryCountRef = useRef(0);

  useEffect(() => {
    if (alreadyUnlocked) {
      return;
    }

    let cancelled = false;
    retryCountRef.current = 0;

    const scheduleRetry = () => {
      if (retryCountRef.current >= MAX_AUTO_RETRIES) {
        return false;
      }
      retryCountRef.current += 1;
      setTimeout(() => {
        if (!cancelled) {
          runStateCheck();
        }
      }, AUTO_RETRY_DELAY_MS);
      return true;
    };

    /** Fetch encryption params with retry logic. */
    const runStateCheck = () => {
      void checkEncryptionState(userId)
        .then(() => {
          if (cancelled) return null;
          return getEncryptionParams();
        })
        .then((result) => {
          if (cancelled || !result) return;

          if (!result.success) {
            if (result.error === "Not authenticated") {
              if (unlockedForUserId) {
                void lockEncryption(unlockedForUserId);
              }
              setNeedsLogin(true);
              setHasCheckedParams(true);
              setPasskeyParams(null);
              return;
            }

            if (scheduleRetry()) {
              return;
            }
            setError(result.error ?? "Failed to check encryption status");
            setHasCheckedParams(true);
            return;
          }

          if (result.data?.type === "passkey" && result.data.passkeyParams) {
            const pp = result.data.passkeyParams;
            setNeedsLogin(false);
            setPasskeyParams({ prfSalt: pp.prf_salt, version: pp.version });
          } else {
            setNeedsLogin(false);
            setPasskeyParams(null);
          }

          retryCountRef.current = 0;
          setHasCheckedParams(true);
        })
        .catch(() => {
          if (cancelled) return;
          if (scheduleRetry()) {
            return;
          }
          setError("Failed to check encryption status");
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUserId = session?.user?.id ?? null;
      if (
        unlockedForUserId &&
        sessionUserId !== null &&
        sessionUserId !== unlockedForUserId
      ) {
        void lockEncryption(unlockedForUserId);
      }
      if (!session) {
        if (unlockedForUserId) void lockEncryption(unlockedForUserId);
      }
    });
    return () => subscription.unsubscribe();
  }, [unlockedForUserId, lockEncryption]);

  useEffect(() => {
    return onKeyEvent((msg) => {
      if (msg.type === "keys-cleared" && unlockedForUserId) {
        void lockEncryption(unlockedForUserId);
      }
      if (msg.type === "master-key-deleted" && unlockedForUserId) {
        if (msg.userId === unlockedForUserId) {
          void lockEncryption(unlockedForUserId);
        }
      }
    });
  }, [unlockedForUserId, lockEncryption]);

  const status: EncryptionStatus = useMemo(() => {
    if (error || contextError) return "error";
    if (alreadyUnlocked) return "unlocked";
    if (contextLoading || !hasCheckedParams) return "loading";
    if (needsLogin) return "needs_login";
    if (passkeyParams) return "needs_unlock";
    return "needs_setup";
  }, [
    alreadyUnlocked,
    error,
    contextError,
    contextLoading,
    hasCheckedParams,
    needsLogin,
    passkeyParams,
  ]);

  useEffect(() => {
    if (redirectingRef.current) return;

    if (status === "needs_login" || status === "needs_unlock") {
      redirectingRef.current = true;
      window.location.href = getAuthLoginUrl();
      return;
    }

    if (status === "needs_setup") {
      redirectingRef.current = true;
      window.location.href = getAuthSetupUrl();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading encryption...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="text-center">
          <p className="text-destructive">
            {error ?? contextError ?? "An error occurred"}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            If this problem persists, contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-muted-foreground mt-4 text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (
    status === "needs_setup" ||
    status === "needs_unlock" ||
    status === "needs_login"
  ) {
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
