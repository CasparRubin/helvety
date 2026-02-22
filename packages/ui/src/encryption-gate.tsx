"use client";

import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { CONTACT_EMAIL } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { onKeyEvent } from "@helvety/shared/crypto/key-storage";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  EncryptionUnlock,
  type EncryptionUnlockActions,
} from "./encryption-unlock";

import type { PRFKeyParams } from "@helvety/shared/crypto/types";
import type {
  ActionResponse,
  UserPasskeyParams,
} from "@helvety/shared/types/entities";

/**
 * Server actions that EncryptionGate needs injected by the consuming app.
 * Extends EncryptionUnlockActions since the gate passes them through to the
 * unlock component.
 */
export interface EncryptionGateActions extends EncryptionUnlockActions {
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

/**
 * Gate component that ensures encryption is set up and unlocked before
 * rendering children. Includes automatic retry on transient errors.
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
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [keyCheckValue, setKeyCheckValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUnlock, setManualUnlock] = useState(false);

  const retryCountRef = useRef(0);

  useEffect(() => {
    if (alreadyUnlocked) {
      setHasCheckedParams(true);
      return;
    }

    let cancelled = false;
    retryCountRef.current = 0;

    /**
     *
     */
    /** Fetch encryption params with retry logic. */
    async function checkState() {
      try {
        await checkEncryptionState(userId);
        if (cancelled) return;

        const result = await getEncryptionParams();
        if (cancelled) return;

        if (!result.success) {
          if (retryCountRef.current < MAX_AUTO_RETRIES) {
            retryCountRef.current += 1;
            await new Promise((r) => setTimeout(r, AUTO_RETRY_DELAY_MS));
            if (cancelled) return;
            void checkState();
            return;
          }
          setError(result.error ?? "Failed to check encryption status");
          setHasCheckedParams(true);
          return;
        }

        if (result.data?.type === "passkey" && result.data.passkeyParams) {
          const pp = result.data.passkeyParams;
          setPasskeyParams({ prfSalt: pp.prf_salt, version: pp.version });
          setCredentialId(pp.credential_id ?? null);
          setKeyCheckValue(pp.key_check_value ?? null);
        }

        retryCountRef.current = 0;
        setHasCheckedParams(true);
      } catch {
        if (cancelled) return;
        if (retryCountRef.current < MAX_AUTO_RETRIES) {
          retryCountRef.current += 1;
          await new Promise((r) => setTimeout(r, AUTO_RETRY_DELAY_MS));
          if (cancelled) return;
          void checkState();
          return;
        }
        setError("Failed to check encryption status");
        setHasCheckedParams(true);
      }
    }

    void checkState();
    return () => {
      cancelled = true;
    };
  }, [userId, checkEncryptionState, alreadyUnlocked, getEncryptionParams]);

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
        setManualUnlock(false);
      }
      if (!session) {
        if (unlockedForUserId) void lockEncryption(unlockedForUserId);
        setManualUnlock(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [unlockedForUserId, lockEncryption]);

  useEffect(() => {
    return onKeyEvent((msg) => {
      if (msg.type === "keys-cleared") {
        setManualUnlock(false);
      }
      if (
        msg.type === "master-key-deleted" &&
        unlockedForUserId &&
        msg.userId === unlockedForUserId
      ) {
        setManualUnlock(false);
      }
    });
  }, [unlockedForUserId]);

  const status: EncryptionStatus = useMemo(() => {
    if (error || contextError) return "error";
    if (contextLoading || !hasCheckedParams) return "loading";
    if (isUnlocked || manualUnlock) return "unlocked";
    if (passkeyParams) return "needs_unlock";
    return "needs_setup";
  }, [
    error,
    contextError,
    contextLoading,
    hasCheckedParams,
    isUnlocked,
    manualUnlock,
    passkeyParams,
  ]);

  const handleUnlock = () => {
    setManualUnlock(true);
  };

  useEffect(() => {
    if (status === "needs_setup") {
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

  if (status === "needs_setup") {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Redirecting to set up encryption...
          </p>
        </div>
      </div>
    );
  }

  if (status === "needs_unlock" && passkeyParams) {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <EncryptionUnlock
          userId={userId}
          passkeyParams={passkeyParams}
          credentialId={credentialId}
          keyCheckValue={keyCheckValue}
          onUnlock={handleUnlock}
          actions={actions}
        />
      </div>
    );
  }

  return <>{children}</>;
}
