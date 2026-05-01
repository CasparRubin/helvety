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

import { EncryptionSetup } from "@/components/encryption-setup";
import { AuthStepper } from "@/components/encryption-stepper";
import { EmailStep } from "@/components/login/email-step";
import { PasskeySignInStep } from "@/components/login/passkey-signin-step";
import { VerifyCodeStep } from "@/components/login/verify-code-step";
import { useLoginFlow } from "@/hooks/use-login-flow";

import type { LoginStep } from "@/lib/login-flow-stepper";

/** Card titles when the outer card is shown (not on encryption-setup). */
const STEP_TITLES: Partial<Record<LoginStep, string>> = {
  email: "Welcome to Helvety",
  "verify-code": "Check Your Email",
  "passkey-signin": "Confirm with your passkey",
};

/** Card descriptions for the same steps as `STEP_TITLES`. */
const STEP_DESCRIPTIONS: Partial<
  Record<LoginStep, string | ((email: string) => string)>
> = {
  email: "Enter your email and confirm your location to continue",
  "verify-code": (email: string) =>
    `We sent a verification code to ${email}. Check your spam folder if you don\u2019t see it.`,
  "passkey-signin":
    "Use your passkey to complete sign-in. This confirms the passkey you use for your account.",
};

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

  const title = STEP_TITLES[flow.step] ?? "";
  const descriptionValue = STEP_DESCRIPTIONS[flow.step];
  const description =
    typeof descriptionValue === "function"
      ? descriptionValue(flow.email)
      : (descriptionValue ?? "");

  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        <AuthStepper
          mode={flow.stepperMode}
          currentStep={flow.currentAuthStep}
        />

        {flow.step === "encryption-setup" && flow.userId && (
          <EncryptionSetup
            redirectUri={flow.redirectUri ?? undefined}
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
