"use client";

import { Button } from "@helvety/ui/button";
import { Checkbox } from "@helvety/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@helvety/ui/dialog";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Loader2, Mail } from "lucide-react";

/** Props for the email input step. */
interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  nonEUEEAConfirmed: boolean;
  onNonEUEEAConfirmedChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
  showRedirectNotice: boolean;
}

/** Email input step - first step of the login flow. */
export function EmailStep({
  email,
  onEmailChange,
  nonEUEEAConfirmed,
  onNonEUEEAConfirmedChange,
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
            disabled={isLoading}
          />
        </div>

        <label
          htmlFor="non-eu-eea-confirmation"
          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 select-none"
        >
          <Checkbox
            id="non-eu-eea-confirmation"
            checked={nonEUEEAConfirmed}
            onCheckedChange={(checked) =>
              onNonEUEEAConfirmedChange(checked === true)
            }
            disabled={isLoading}
            className="mt-0.5"
          />
          <span className="text-foreground text-sm leading-relaxed">
            I confirm that I am <strong>not</strong> located in the European
            Union (EU) or European Economic Area (EEA).
          </span>
        </label>
        <Dialog>
          <DialogTrigger
            render={
              <button
                type="button"
                className="text-primary mx-auto block text-xs underline underline-offset-4 hover:opacity-90"
              />
            }
            nativeButton={false}
          >
            Why can&apos;t Helvety currently serve EU/EEA customers?
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Why EU/EEA access is currently restricted
              </DialogTitle>
              <DialogDescription>
                Helvety is a Swiss sole proprietorship. For now, we do not have
                the legal/compliance capacity required to offer account-based
                services to users located in the EU/EEA.
              </DialogDescription>
            </DialogHeader>
            <DialogDescription>
              We would like to serve EU/EEA customers in the future, but at the
              moment we must restrict access until we can meet those legal
              requirements safely and responsibly.
            </DialogDescription>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>

        {error && (
          <p role="alert" className="text-destructive text-center text-sm">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !email || !nonEUEEAConfirmed}
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
          We&apos;ll send a verification code to your email to continue.
        </p>
      </form>

      {showRedirectNotice && (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          You&apos;ll be redirected back after signing in.
        </p>
      )}
    </>
  );
}
