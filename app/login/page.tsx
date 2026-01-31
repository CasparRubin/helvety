"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback, useRef } from "react";

import {
  generatePasskeyAuthOptions,
  verifyPasskeyAuthentication,
  hasPasskeyCredentials,
} from "@/app/actions/passkey-auth-actions";
import {
  AuthStepper,
  type AuthFlowType,
  type AuthStep,
} from "@/components/auth-stepper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPasskeySupported } from "@/lib/crypto/passkey";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";

type LoginStep = "email" | "check_email" | "passkey_auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("email");
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const magicLinkTimestamps = useRef<number[]>([]);

  // Check for auth errors from callback
  // Note: error=missing_params with hash tokens is handled by the init effect
  useEffect(() => {
    const authError = searchParams.get("error");
    // Don't show missing_params error if we have hash tokens (passkey auth flow)
    const hasHashTokens =
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token");

    if (authError === "auth_failed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reading from URL params on mount
      setError("Authentication failed. Please try again.");
    } else if (authError === "missing_params" && !hasHashTokens) {
      setError("Invalid authentication link.");
    }
  }, [searchParams]);

  // Check if user is already logged in, handle hash tokens, and check passkey support
  useEffect(() => {
    const init = async () => {
      // Check WebAuthn support
      const supported = isPasskeySupported();
      setPasskeySupported(supported);

      // Handle hash fragment tokens (from passkey auth via generateLink)
      // URL fragments aren't sent to server, so we handle them client-side
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set the session from the hash tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!sessionError) {
            // Clear the hash and redirect to home
            window.history.replaceState(null, "", window.location.pathname);
            router.push("/");
            return;
          }

          logger.error("Failed to set session from hash:", sessionError);
          // Clear the hash to avoid confusion
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      }

      // Check if user is already logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
        return;
      }

      setCheckingAuth(false);
    };
    void init();
  }, [router, supabase]);

  // Check if user has passkey when email is entered
  const checkUserPasskey = useCallback(
    async (userEmail: string) => {
      if (!passkeySupported) return false;

      const result = await hasPasskeyCredentials(userEmail);
      return result.success && result.data === true;
    },
    [passkeySupported]
  );

  // Handle email submission - check if user has passkey
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user has a passkey registered
      const userHasPasskey = await checkUserPasskey(normalizedEmail);
      setHasPasskey(userHasPasskey);

      if (userHasPasskey) {
        // Returning user - go directly to passkey authentication (no email needed)
        setIsLoading(false);
        await handlePasskeyAuth();
      } else {
        // New user or user without passkey - send magic link to authenticate
        await sendMagicLink(normalizedEmail);
        setIsLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Send magic link for authentication (creates user if new)
  const sendMagicLink = async (userEmail: string) => {
    // Rate limit: max 2 requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = magicLinkTimestamps.current.filter(
      (t) => t > oneMinuteAgo
    );

    if (recentRequests.length >= 2) {
      setError("Too many requests. Please wait a minute before trying again.");
      return;
    }

    // Track this request
    magicLinkTimestamps.current = [...recentRequests, now];

    // Magic link flow - creates user if new, logs in if existing
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setStep("check_email");
  };

  // Handle passkey authentication (mandatory for returning users)
  const handlePasskeyAuth = useCallback(async () => {
    setError("");
    setIsLoading(true);
    setStep("passkey_auth");

    try {
      const origin = window.location.origin;

      // Generate authentication options from server
      const optionsResult = await generatePasskeyAuthOptions(origin);
      if (!optionsResult.success || !optionsResult.data) {
        setError(
          optionsResult.error ?? "Failed to start passkey authentication"
        );
        setStep("email");
        setIsLoading(false);
        return;
      }

      // Start WebAuthn authentication (shows QR code for phone)
      let authResponse;
      try {
        authResponse = await startAuthentication({
          optionsJSON: optionsResult.data,
        });
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError("Authentication was cancelled");
          } else if (err.name === "AbortError") {
            setError("Authentication timed out");
          } else {
            setError("Failed to authenticate with passkey");
          }
        } else {
          setError("Failed to authenticate with passkey");
        }
        setStep("email");
        setIsLoading(false);
        return;
      }

      // Verify authentication on server
      const verifyResult = await verifyPasskeyAuthentication(
        authResponse,
        origin
      );
      if (!verifyResult.success || !verifyResult.data) {
        setError(verifyResult.error ?? "Authentication verification failed");
        setStep("email");
        setIsLoading(false);
        return;
      }

      // Redirect to the auth URL to complete session creation
      window.location.href = verifyResult.data.authUrl;
    } catch (err) {
      logger.error("Passkey auth error:", err);
      setError("An unexpected error occurred");
      setStep("email");
      setIsLoading(false);
    }
  }, []);

  // Go back to email step
  const handleBack = () => {
    setStep("email");
    setError("");
    setHasPasskey(false);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Determine flow type and current step for the stepper
  const flowType: AuthFlowType = hasPasskey ? "returning_user" : "new_user";
  const currentAuthStep: AuthStep = (() => {
    if (step === "email" || step === "check_email") return "email";
    if (step === "passkey_auth") return "sign_in";
    return "email";
  })();

  return (
    <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        {/* Show stepper - for new users show 3 steps, for returning users show 2 */}
        <AuthStepper flowType={flowType} currentStep={currentAuthStep} />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {step === "email" && "Welcome"}
              {step === "check_email" && "Check Your Email"}
              {step === "passkey_auth" && "Authenticating..."}
            </CardTitle>
            <CardDescription>
              {step === "email" &&
                "Enter your email to sign in or create an account"}
              {step === "check_email" &&
                `We sent a verification email to ${email}`}
              {step === "passkey_auth" &&
                "Complete authentication on your phone"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Enter email */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email webauthn"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  No password needed. We&apos;ll verify your identity securely.
                </p>
              </form>
            )}

            {/* Check email step - waiting for user to click magic link */}
            {step === "check_email" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                    <Mail className="text-primary h-6 w-6" />
                  </div>
                </div>
                <p className="text-muted-foreground text-center text-sm">
                  Click the link in your email to continue.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use different email
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  Check your spam folder if you don&apos;t see the email.
                </p>
              </div>
            )}

            {/* Passkey authentication in progress */}
            {step === "passkey_auth" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                </div>
                <p className="text-muted-foreground text-center text-sm">
                  Scan the QR code with your phone and verify with Face ID or
                  fingerprint.
                </p>
                {error && (
                  <p className="text-destructive text-center text-sm">
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it
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
