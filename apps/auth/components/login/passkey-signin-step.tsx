"use client";

import { Button } from "@helvety/ui/button";
import { Loader2, KeyRound } from "lucide-react";

/** Props for the passkey sign-in step. */
interface PasskeySignInStepProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string;
  passkeySupported: boolean;
  isMobile: boolean;
}

/** Passkey sign-in step for existing users. */
export function PasskeySignInStep({
  onSignIn,
  isLoading,
  error,
  passkeySupported,
  isMobile,
}: PasskeySignInStepProps) {
  return (
    <div className="space-y-4">
      {!passkeySupported && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          Your browser doesn&apos;t support passkeys. Please use Chrome 128+,
          Edge 128+, Safari 18+, or Firefox 139+ on desktop.
        </div>
      )}

      <div className="flex items-center justify-center py-4">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          {isLoading ? (
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          ) : (
            <KeyRound className="text-primary h-8 w-8" />
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {isLoading
          ? isMobile
            ? "Use Face ID, fingerprint, or PIN on this device."
            : "Scan the QR code with your phone and verify with Face ID, fingerprint, or PIN."
          : "Use your passkey to verify your identity and complete sign in."}
      </p>

      {error && (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      )}

      <Button
        onClick={onSignIn}
        disabled={isLoading || !passkeySupported}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Authenticating..." : "Sign In with Passkey"}
      </Button>
    </div>
  );
}
