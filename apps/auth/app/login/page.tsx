"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { AuthStepper } from "@/components/auth-stepper";
import { EncryptionSetup } from "@/components/encryption-setup";
import { EmailStep } from "@/components/login/email-step";
import { PasskeySignInStep } from "@/components/login/passkey-signin-step";
import { VerifyCodeStep } from "@/components/login/verify-code-step";
import { useLoginFlow } from "@/hooks/use-login-flow";

import type { LoginStep } from "@/lib/login-flow-stepper";

/** Card titles when the outer card is shown (not on encryption-setup). */
function loginStepTitle(step: LoginStep): string {
  switch (step) {
    case "email":
      return "Welcome to Helvety";
    case "verify-code":
      return "Check Your Email";
    case "passkey-signin":
      return "Confirm with your passkey";
    case "encryption-setup":
      return "";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

/** Card descriptions for the same steps as `loginStepTitle`. */
function loginStepDescription(step: LoginStep, email: string): string {
  switch (step) {
    case "email":
      return "Enter your email and confirm your location to continue";
    case "verify-code":
      return `We sent a verification code to ${email}. Check your spam folder if you don\u2019t see it.`;
    case "passkey-signin":
      return "Use your passkey to complete sign-in. This confirms the passkey you use for your account.";
    case "encryption-setup":
      return "";
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

/** Main login page: email → OTP → passkey (with optional encryption setup between OTP and sign-in when required). */
function LoginContent() {
  const flow = useLoginFlow();

  if (flow.checkingAuth) {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const title = loginStepTitle(flow.step);
  const description = loginStepDescription(flow.step, flow.email);

  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        {/* Stepper is outside the Card so it overlays the pillar on md+ dark; opaque bg-card strip in AuthStepper. */}
        <AuthStepper
          mode={flow.stepperMode}
          currentStep={flow.currentAuthStep}
        />

        {flow.step === "encryption-setup" && flow.userId && (
          <EncryptionSetup
            userId={flow.userId}
            onRegistrationComplete={flow.handlePasskeyRegistrationComplete}
          />
        )}

        {flow.step !== "encryption-setup" && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {flow.step === "email" && (
                <EmailStep
                  email={flow.email}
                  onEmailChange={flow.setEmail}
                  nonEUEEAConfirmed={flow.nonEUEEAConfirmed}
                  onNonEUEEAConfirmedChange={flow.setNonEUEEAConfirmed}
                  onSubmit={flow.handleEmailSubmit}
                  isLoading={flow.isLoading}
                  error={flow.error}
                  showRedirectNotice={!!flow.redirectUri}
                />
              )}

              {flow.step === "verify-code" && (
                <VerifyCodeStep
                  email={flow.email}
                  otpCode={flow.otpCode}
                  onOtpCodeChange={flow.setOtpCode}
                  onSubmit={flow.handleCodeVerify}
                  onResend={flow.handleResendCode}
                  onBack={flow.handleBack}
                  isLoading={flow.isLoading}
                  error={flow.error}
                  resendCooldown={flow.resendCooldown}
                />
              )}

              {flow.step === "passkey-signin" && (
                <PasskeySignInStep
                  onSignIn={flow.handlePasskeySignIn}
                  isLoading={flow.isLoading}
                  error={flow.error}
                  passkeySupported={flow.passkeySupported}
                  isMobile={flow.isMobile}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/** Login page wrapped in Suspense (required by useSearchParams). */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
