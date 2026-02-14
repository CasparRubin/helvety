"use client";

import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Props for the passkey verification step. */
interface PasskeyVerifyStepProps {
  onVerify: () => void;
  onSkip: () => void;
  isLoading: boolean;
  error: string;
  passkeySupported: boolean;
}

/** Passkey verification step after initial setup. */
export function PasskeyVerifyStep({
  onVerify,
  onSkip,
  isLoading,
  error,
  passkeySupported,
}: PasskeyVerifyStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          ) : (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {isLoading
          ? "Verifying your passkey..."
          : "Your passkey has been created! Now verify it to complete your account setup."}
      </p>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      <Button
        onClick={onVerify}
        disabled={isLoading || !passkeySupported}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Verifying..." : "Verify Passkey"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onSkip}
        disabled={isLoading}
      >
        Skip for now
      </Button>
    </div>
  );
}
