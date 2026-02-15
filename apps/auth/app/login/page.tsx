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
import { GeoConfirmationStep } from "@/components/geo-confirmation-step";
import {
  EmailStep,
  VerifyCodeStep,
  PasskeySignInStep,
  PasskeyVerifyStep,
} from "@/components/login";
import { useLoginFlow } from "@/hooks/use-login-flow";

/** Card titles for each login step. */
const STEP_TITLES: Record<string, string> = {
  email: "Welcome to Helvety",
  "geo-confirmation": "Location Confirmation",
  "verify-code": "Check Your Email",
  "passkey-signin": "Sign In with Passkey",
  "passkey-verify": "Verify Your Passkey",
};

/** Card descriptions for each login step. */
const STEP_DESCRIPTIONS: Record<string, string | ((email: string) => string)> =
  {
    email: "Enter your email to sign in or create an account",
    "geo-confirmation":
      "Before we create your account, please confirm your location",
    "verify-code": (email: string) =>
      `We sent a verification code to ${email}. Check your spam folder if you don\u2019t see it.`,
    "passkey-signin": "Use your passkey to sign in",
    "passkey-verify": "Verify your new passkey to complete setup",
  };

/** Main login flow component handling email, OTP verification, and passkey steps. */
function LoginContent() {
  const flow = useLoginFlow();

  // Show loading while checking auth
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
        {/* Show stepper - hidden on initial email step (flow type unknown) and encryption-setup (has its own stepper) */}
        {flow.step !== "email" && flow.step !== "encryption-setup" && (
          <AuthStepper
            flowType={flow.flowType}
            currentStep={flow.currentAuthStep}
          />
        )}

        {/* Show encryption setup component for encryption-setup step */}
        {flow.step === "encryption-setup" && flow.userId && (
          <EncryptionSetup
            flowType={flow.flowType}
            redirectUri={flow.redirectUri ?? undefined}
          />
        )}

        {/* Show card for other steps */}
        {flow.step !== "encryption-setup" && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {flow.step === "geo-confirmation" && (
                <GeoConfirmationStep
                  isLoading={flow.isLoading}
                  error={flow.error}
                  onConfirm={flow.handleGeoConfirm}
                  onBack={flow.handleBack}
                />
              )}

              {flow.step === "email" && (
                <EmailStep
                  email={flow.email}
                  onEmailChange={flow.setEmail}
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

              {flow.step === "passkey-verify" && (
                <PasskeyVerifyStep
                  onVerify={flow.handlePasskeySignIn}
                  onSkip={flow.handleCompleteAuth}
                  isLoading={flow.isLoading}
                  error={flow.error}
                  passkeySupported={flow.passkeySupported}
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
