"use client";

import { generateKeyCheckValue } from "@helvety/shared/crypto/key-check";
import { cachePRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { logger } from "@helvety/shared/logger";
import { Button } from "@helvety/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { Fingerprint, Lock, Loader2, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  verifyEncryptionPasskey,
  saveKeyCheckValue,
} from "@/app/actions/encryption-actions";
import { useEncryptionContext, type PRFKeyParams } from "@/lib/crypto";

/** Props for the EncryptionUnlock component */
interface EncryptionUnlockProps {
  /** The authenticated user's ID */
  userId: string;
  /** PRF-based params for passkey unlock */
  passkeyParams: PRFKeyParams;
  /** Credential ID for filtering WebAuthn allowCredentials */
  credentialId?: string | null;
  /** Key check value for validating the derived key */
  keyCheckValue?: string | null;
  /** Callback when encryption is successfully unlocked */
  onUnlock?: () => void;
}

/** Verify server-side that the passkey credential belongs to the session user. */
async function verifyCredentialOwnership(
  credentialId: string
): Promise<boolean> {
  const result = await verifyEncryptionPasskey(credentialId);
  return result.success && result.data?.verified === true;
}

/**
 * Component for unlocking encryption with passkey.
 * Shown to users who have set up passkey encryption but need to unlock.
 * Auto-triggers the passkey popup on mount for a seamless unlock flow.
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
  credentialId,
  keyCheckValue,
  onUnlock,
}: EncryptionUnlockProps) {
  const { unlockWithPasskey, masterKey } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasAttemptedAutoUnlock = useRef(false);

  const handleUnlock = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const credentialIds = credentialId ? [credentialId] : undefined;
      const success = await unlockWithPasskey(
        userId,
        passkeyParams,
        credentialIds,
        verifyCredentialOwnership,
        keyCheckValue
      );

      if (!success) {
        setError("Failed to authenticate with passkey");
        setIsLoading(false);
        return;
      }

      // Cache PRF salt so future logins can include PRF for single-touch unlock
      cachePRFSalt(passkeyParams.prfSalt, passkeyParams.version);

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
  }, [
    unlockWithPasskey,
    userId,
    passkeyParams,
    credentialId,
    keyCheckValue,
    onUnlock,
  ]);

  // After successful unlock, generate and save a KCV if one doesn't exist yet
  useEffect(() => {
    if (!masterKey || keyCheckValue || !csrfToken) return;

    void (async () => {
      try {
        const kcv = await generateKeyCheckValue(masterKey);
        await saveKeyCheckValue(kcv, csrfToken);
      } catch (err) {
        logger.warn("Failed to generate/save key check value:", err);
      }
    })();
  }, [masterKey, keyCheckValue, csrfToken]);

  // Auto-trigger passkey popup on mount
  useEffect(() => {
    if (!hasAttemptedAutoUnlock.current) {
      hasAttemptedAutoUnlock.current = true;
      // Use timeout to defer execution (avoids synchronous setState in effect)
      const timer = setTimeout(() => {
        void handleUnlock();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [handleUnlock]);

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="text-primary h-5 w-5" />
            <CardTitle>Unlock Your Data</CardTitle>
          </div>
          <CardDescription>
            Use your passkey to decrypt and access your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              {isLoading ? (
                <Loader2 className="text-primary h-5 w-5 animate-spin" />
              ) : (
                <Smartphone className="text-primary h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">Passkey Authentication</p>
              <p className="text-muted-foreground text-sm">
                Verify with your passkey to unlock encryption
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

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
            <p className="text-muted-foreground text-center text-xs">
              Waiting for passkey verification...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
