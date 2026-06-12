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
  const isLocalDevHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return (
    <div className="space-y-4">
      {isLocalDevHost && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
          Local dev uses WebAuthn RP ID{" "}
          <code className="text-xs">localhost</code>. Passkeys registered on{" "}
          <code className="text-xs">helvety.com</code> do not work here. Create
          or choose a passkey saved for localhost when prompted.
        </div>
      )}

      {!passkeySupported && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          Your browser doesn&apos;t support passkeys in this flow. Please try a
          current version of Chrome, Edge, Safari, or Firefox.
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
          : isMobile
            ? "Use your passkey to verify your identity and complete sign in."
            : "Click below to scan a QR code with your phone and verify with your passkey."}
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
        {isLoading ? "Authenticating..." : "Sign in with passkey"}
      </Button>
    </div>
  );
}
