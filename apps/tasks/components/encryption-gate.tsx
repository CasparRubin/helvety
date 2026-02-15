"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";

import { getEncryptionParams } from "@/app/actions/encryption-actions";
import { EncryptionUnlock } from "@/components/encryption-unlock";
import { getLoginUrl } from "@/lib/auth-redirect";
import { useEncryptionContext, type PRFKeyParams } from "@/lib/crypto";

/** Props for the EncryptionGate component */
interface EncryptionGateProps {
  /** The authenticated user's ID */
  userId: string;
  /** The authenticated user's email address */
  userEmail: string;
  /** Content to render when encryption is unlocked */
  children: ReactNode;
}

/** Encryption gate status states */
type EncryptionStatus =
  | "loading"
  | "needs_setup"
  | "needs_unlock"
  | "unlocked"
  | "error";

/** Maximum number of automatic retries on transient errors */
const MAX_AUTO_RETRIES = 1;

/** Delay before an automatic retry (ms) */
const AUTO_RETRY_DELAY_MS = 1_000;

/**
 * Get the auth URL for encryption setup
 * Redirects to auth service with the current URL as redirect_uri
 * and an encryption-setup step parameter.
 */
function getAuthSetupUrl(): string {
  const loginUrl = getLoginUrl(
    typeof window !== "undefined" ? window.location.href : undefined
  );
  // Append the encryption-setup step to the existing login URL
  const url = new URL(loginUrl);
  url.searchParams.set("step", "encryption-setup");
  return url.toString();
}

/**
 * Gate component that ensures encryption is set up and unlocked
 * before rendering children.
 *
 * If encryption is not set up, redirects to auth.helvety.com for setup.
 * Supports passkey-based encryption (PRF).
 *
 * Includes automatic retry logic: on transient errors (e.g. network blip
 * during getEncryptionParams()), the check is retried once before showing
 * the error screen. This prevents VPN/Private Relay glitches from surfacing
 * as user-visible errors.
 */
export function EncryptionGate({
  userId,
  userEmail: _userEmail,
  children,
}: EncryptionGateProps) {
  const {
    isUnlocked,
    isLoading: contextLoading,
    checkEncryptionState,
    error: contextError,
  } = useEncryptionContext();

  const [hasCheckedParams, setHasCheckedParams] = useState(false);
  const [passkeyParams, setPasskeyParams] = useState<PRFKeyParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUnlock, setManualUnlock] = useState(false);

  // Track auto-retry count to avoid infinite loops
  const retryCountRef = useRef(0);

  // Check encryption state on mount (with auto-retry on transient errors)
  useEffect(() => {
    /** Checks encryption state on mount (cached key and DB params). */
    async function checkState() {
      try {
        // First check if we have a cached key
        await checkEncryptionState(userId);

        // Then check if user has encryption params in DB
        const result = await getEncryptionParams();

        if (!result.success) {
          // Auto-retry once on transient errors before showing error screen
          if (retryCountRef.current < MAX_AUTO_RETRIES) {
            retryCountRef.current += 1;
            await new Promise((r) => setTimeout(r, AUTO_RETRY_DELAY_MS));
            void checkState();
            return;
          }
          setError(result.error ?? "Failed to check encryption status");
          setHasCheckedParams(true);
          return;
        }

        if (result.data?.type === "passkey" && result.data.passkeyParams) {
          // User has passkey encryption set up
          setPasskeyParams({
            prfSalt: result.data.passkeyParams.prf_salt,
            version: result.data.passkeyParams.version,
          });
        }

        // Success - reset retry counter
        retryCountRef.current = 0;
        setHasCheckedParams(true);
      } catch {
        // Auto-retry once on unexpected errors (network failure, etc.)
        if (retryCountRef.current < MAX_AUTO_RETRIES) {
          retryCountRef.current += 1;
          await new Promise((r) => setTimeout(r, AUTO_RETRY_DELAY_MS));
          void checkState();
          return;
        }
        setError("Failed to check encryption status");
        setHasCheckedParams(true);
      }
    }

    void checkState();
  }, [userId, checkEncryptionState]);

  // Derive status from state (no setState in effect)
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

  // Handle unlock success
  const handleUnlock = () => {
    setManualUnlock(true);
  };

  // Redirect to auth for setup when needed
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
              href="mailto:contact@helvety.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              contact@helvety.com
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
    // Will redirect via useEffect above, show loading in the meantime
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
          onUnlock={handleUnlock}
        />
      </div>
    );
  }

  // Unlocked - render children
  return <>{children}</>;
}
