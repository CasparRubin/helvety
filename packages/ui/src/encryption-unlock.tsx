"use client";

import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { generateKeyCheckValue } from "@helvety/shared/crypto/key-check";
import { cachePRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { logger } from "@helvety/shared/logger";
import { Fingerprint, Loader2, Lock, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@helvety/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import { useCSRFToken } from "@helvety/ui/csrf-provider";

import type { PRFKeyParams } from "@helvety/shared/crypto/types";
import type { ActionResponse } from "@helvety/shared/types/entities";

/**
 * Server actions that EncryptionUnlock needs injected by the consuming app.
 * These are app-local "use server" functions that cannot live in a shared package.
 */
export interface EncryptionUnlockActions {
  verifyEncryptionPasskey: (
    credentialId: string
  ) => Promise<ActionResponse<{ verified: boolean }>>;
  saveKeyCheckValue: (
    kcv: string,
    csrfToken: string
  ) => Promise<ActionResponse>;
}

/** Props for the shared EncryptionUnlock component */
export interface EncryptionUnlockProps {
  userId: string;
  passkeyParams: PRFKeyParams;
  credentialId?: string | null;
  keyCheckValue?: string | null;
  onUnlock?: () => void;
  actions: EncryptionUnlockActions;
}

/**
 * Passkey-based encryption unlock component. Auto-triggers the passkey popup
 * on mount and generates a key check value after first successful unlock.
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
  credentialId,
  keyCheckValue,
  onUnlock,
  actions,
}: EncryptionUnlockProps) {
  const { verifyEncryptionPasskey, saveKeyCheckValue } = actions;
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
        async (credId: string) => {
          const result = await verifyEncryptionPasskey(credId);
          return result.success && result.data?.verified === true;
        },
        keyCheckValue
      );

      if (!success) {
        setError("Failed to authenticate with passkey");
        setIsLoading(false);
        return;
      }

      cachePRFSalt(passkeyParams.prfSalt, passkeyParams.version);

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
    verifyEncryptionPasskey,
  ]);

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
  }, [masterKey, keyCheckValue, csrfToken, saveKeyCheckValue]);

  useEffect(() => {
    if (!hasAttemptedAutoUnlock.current) {
      hasAttemptedAutoUnlock.current = true;
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
