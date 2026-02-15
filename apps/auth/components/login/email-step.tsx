"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Loader2, Mail } from "lucide-react";

/** Props for the email input step. */
interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  showRedirectNotice: boolean;
}

/** Email input step - first step of the login flow. */
export function EmailStep({
  email,
  onEmailChange,
  onSubmit,
  isLoading,
  error,
  showRedirectNotice,
}: EmailStepProps) {
  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <p className="text-destructive text-center text-sm">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !email}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Continue
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          New users and users without a passkey receive a code by email.
          Returning users with a passkey sign in directly.
        </p>
      </form>

      {showRedirectNotice && (
        <p className="text-muted-foreground mt-6 text-center text-xs">
          You&apos;ll be redirected back after signing in.
        </p>
      )}
    </>
  );
}
