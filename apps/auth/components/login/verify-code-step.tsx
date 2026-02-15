"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { OTP_CODE_LENGTH } from "@/hooks/use-login-flow";

/** Props for the OTP verification step. */
interface VerifyCodeStepProps {
  email: string;
  otpCode: string;
  onOtpCodeChange: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  resendCooldown: number;
}

/** OTP code verification step. */
export function VerifyCodeStep({
  email,
  otpCode,
  onOtpCodeChange,
  onSubmit,
  onResend,
  onBack,
  isLoading,
  error,
  resendCooldown,
}: VerifyCodeStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-center py-4">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-primary h-8 w-8" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-code">Verification code</Label>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="000000"
          value={otpCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            onOtpCodeChange(value);
          }}
          required
          autoFocus
          disabled={isLoading}
          className="text-center text-2xl tracking-[0.3em]"
          autoComplete="one-time-code"
        />
      </div>

      <p className="text-muted-foreground text-center text-sm">
        Enter the code we sent to {email}. The code expires in 1 hour.
      </p>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={isLoading || otpCode.length < OTP_CODE_LENGTH}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Verify Code
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onResend}
          disabled={isLoading || resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Resend code (${resendCooldown}s)`
            : "Resend code"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Use a different email
        </Button>
      </div>
    </form>
  );
}
