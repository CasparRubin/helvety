"use client";

import { Fingerprint, Lock, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEncryptionContext, type PRFKeyParams } from "@/lib/crypto";

interface EncryptionUnlockProps {
  userId: string;
  /** PRF-based params for passkey unlock */
  passkeyParams: PRFKeyParams;
  onUnlock?: () => void;
}

/**
 * Component for unlocking encryption with passkey
 * Shown to users who have set up passkey encryption but need to unlock
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
  onUnlock,
}: EncryptionUnlockProps) {
  const { unlockWithPasskey } = useEncryptionContext();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
                <Fingerprint className="text-primary h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">Passkey Authentication</p>
              <p className="text-muted-foreground text-sm">
                Scan the QR code with your phone
              </p>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

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
              Waiting for your phone...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
