"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, type ReactNode } from "react";

import { getEncryptionParams } from "@/app/actions/encryption-actions";
import { EncryptionUnlock } from "@/components/encryption-unlock";
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

/**
 * Get the auth URL for encryption setup
 * Redirects to auth.helvety.com with the current URL as redirect_uri
 */
function getAuthSetupUrl(): string {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const authBaseUrl = isDev
    ? "http://localhost:3002"
    : "https://auth.helvety.com";

  const url = new URL(authBaseUrl);
  url.pathname = "/login";
  url.searchParams.set("step", "encryption-setup");
  if (currentUrl) {
    url.searchParams.set("redirect_uri", currentUrl);
  }

  return url.toString();
}

/**
 * Gate component that ensures encryption is set up and unlocked
 * before rendering children.
 *
 * If encryption is not set up, redirects to auth.helvety.com for setup.
 * Supports passkey-based encryption (PRF).
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
  } = useEncryptionContext();

  const [hasCheckedParams, setHasCheckedParams] = useState(false);
  const [passkeyParams, setPasskeyParams] = useState<PRFKeyParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUnlock, setManualUnlock] = useState(false);

  // Check encryption state on mount
  useEffect(() => {
    /**
     *
     */
    async function checkState() {
      try {
        // First check if we have a cached key
        await checkEncryptionState(userId);

        // Then check if user has encryption params in DB
        const result = await getEncryptionParams();

        if (!result.success) {
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

        setHasCheckedParams(true);
      } catch {
        setError("Failed to check encryption status");
        setHasCheckedParams(true);
      }
    }

    void checkState();
  }, [userId, checkEncryptionState]);

  // Derive status from state (no setState in effect)
  const status: EncryptionStatus = useMemo(() => {
    if (error) return "error";
    if (contextLoading || !hasCheckedParams) return "loading";
    if (isUnlocked || manualUnlock) return "unlocked";
    if (passkeyParams) return "needs_unlock";
    return "needs_setup";
  }, [
    error,
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
          <p className="text-destructive">{error ?? "An error occurred"}</p>
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
