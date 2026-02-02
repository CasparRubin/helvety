"use client";

import { Fingerprint, Lock, Loader2, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  useEncryptionContext,
  type PRFKeyParams,
  getDeviceCapabilities,
} from "@/lib/crypto";

/** Authentication method based on device capabilities */
type AuthMethod = "platform" | "hybrid" | "detecting";

/**
 *
 */
interface EncryptionUnlockProps {
  userId: string;
  /** PRF-based params for passkey unlock */
  passkeyParams: PRFKeyParams;
  onUnlock?: () => void;
}

/**
 * Component for unlocking encryption with passkey
 * Shown to users who have set up passkey encryption but need to unlock
 * Automatically detects device capabilities for context-aware messaging
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
  onUnlock,
}: EncryptionUnlockProps) {
  const { unlockWithPasskey } = useEncryptionContext();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("detecting");

  // Detect device capabilities on mount
  useEffect(() => {
    async function detectCapabilities() {
      try {
        const capabilities = await getDeviceCapabilities();
        setAuthMethod(capabilities.usePlatformAuth ? "platform" : "hybrid");
      } catch {
        // Default to hybrid (QR code) if detection fails
        setAuthMethod("hybrid");
      }
    }
    void detectCapabilities();
  }, []);

  const handleUnlock = async () => {
    setError("");
    setIsLoading(true);

    try {
      const success = await unlockWithPasskey(userId, passkeyParams);

      if (!success) {
        setError("Failed to authenticate with passkey");
        setIsLoading(false);
        return;
      }

      // Success
      if (onUnlock) {
        onUnlock();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unlock encryption";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="text-primary h-5 w-5" />
          <h2 className="text-lg font-semibold">Unlock Your Data</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Use your passkey to decrypt and access your data.
        </p>

        <div className="mb-4 flex items-center gap-3 rounded-lg border p-4">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            {isLoading ? (
              <Loader2 className="text-primary h-5 w-5 animate-spin" />
            ) : authMethod === "platform" ? (
              <Fingerprint className="text-primary h-5 w-5" />
            ) : (
              <Smartphone className="text-primary h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium">Passkey Authentication</p>
            <p className="text-muted-foreground text-sm">
              {authMethod === "detecting"
                ? "Detecting authentication method..."
                : authMethod === "platform"
                  ? "Use Face ID, Touch ID, or fingerprint"
                  : "Scan the QR code with your phone"}
            </p>
          </div>
        </div>

        {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

        <Button
          onClick={handleUnlock}
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unlocking...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Unlock with Passkey
            </>
          )}
        </Button>

        {isLoading && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {authMethod === "platform"
              ? "Waiting for authentication..."
              : "Waiting for your phone..."}
          </p>
        )}
      </div>
    </div>
  );
}
