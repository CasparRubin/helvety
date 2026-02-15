"use client";

import { isPasskeySupported } from "@helvety/shared/crypto/passkey";
import { logger } from "@helvety/shared/logger";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

import {
  checkEmail,
  sendVerificationCode,
  verifyEmailCode,
} from "@/app/actions/otp-actions";
import {
  generatePasskeyAuthOptions,
  verifyPasskeyAuthentication,
} from "@/app/actions/passkey-auth-actions";
import { useCSRF } from "@/hooks/use-csrf";
import { getRequiredAuthStep } from "@/lib/auth-utils";
import { isMobileDevice } from "@/lib/device-utils";


import type { AuthStep, AuthFlowType } from "@/components/encryption-stepper";

/** Duration (in seconds) before the user can resend an OTP code. */
const RESEND_COOLDOWN_SECONDS = 120;

/** Required length of the one-time password code. */
export const OTP_CODE_LENGTH = 6;

/** Steps in the login flow, rendered sequentially. */
export type LoginStep =
  | "email" // Enter email
  | "geo-confirmation" // Non-EU confirmation (new users only)
  | "verify-code" // Enter OTP code from email
  | "passkey-signin" // Sign in with existing passkey
  | "passkey-verify" // Verify newly created passkey
  | "encryption-setup"; // Set up encryption with passkey

/** Return type of the useLoginFlow hook */
export interface LoginFlowState {
  step: LoginStep;
  email: string;
  setEmail: (email: string) => void;
  error: string;
  isLoading: boolean;
  checkingAuth: boolean;
  passkeySupported: boolean;
  isMobile: boolean;
  userId: string | null;
  otpCode: string;
  setOtpCode: (code: string) => void;
  resendCooldown: number;
  skippedToPasskey: boolean;
  isNewUser: boolean;
  redirectUri: string | null;
  isNewUserParam: string | null;
  currentAuthStep: AuthStep;
  flowType: AuthFlowType;
  handleEmailSubmit: (e: React.FormEvent) => Promise<void>;
  handleGeoConfirm: () => Promise<void>;
  handleCodeVerify: (e: React.FormEvent) => Promise<void>;
  handleResendCode: () => Promise<void>;
  handlePasskeySignIn: () => Promise<void>;
  handleCompleteAuth: () => void;
  handleBack: () => void;
}

/** Hook encapsulating the entire login flow state and handlers. */
export function useLoginFlow(): LoginFlowState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();
  const csrfToken = useCSRF();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Get parameters from URL (validate redirect URI against allowlist to prevent open redirects)
  const rawRedirectUri = searchParams.get("redirect_uri");
  const redirectUri = isValidRedirectUri(rawRedirectUri)
    ? rawRedirectUri
    : null;
  const stepParam = searchParams.get("step") as LoginStep | null;
  const authError = searchParams.get("error");
  const isNewUserParam = searchParams.get("is_new_user");

  // Compute initial step from URL or default to email
  const initialStep: LoginStep =
    stepParam === "passkey-signin" || stepParam === "encryption-setup"
      ? stepParam
      : "email";

  // Compute initial error from URL
  const initialError =
    authError === "auth_failed"
      ? "Authentication failed. Please try again."
      : authError === "missing_params"
        ? "Invalid authentication link."
        : "";

  const [step, setStep] = useState<LoginStep>(initialStep);
  const [error, setError] = useState(initialError);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [skippedToPasskey, setSkippedToPasskey] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const hasAutoTriggered = useRef(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Device detection for passkey flow (client-only, set on mount)
  useEffect(() => {
    const id = setTimeout(() => setIsMobile(isMobileDevice()), 0);
    return () => clearTimeout(id);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize: check passkey support and existing session
  useEffect(() => {
    const init = async () => {
      // Check WebAuthn support
      const supported = isPasskeySupported();
      setPasskeySupported(supported);

      // Get current user if any
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is authenticated and we're on passkey or encryption step, stay on that step
      if (
        user &&
        (step === "passkey-signin" ||
          step === "passkey-verify" ||
          step === "encryption-setup")
      ) {
        setEmail(user.email ?? "");
        setUserId(user.id);
        setCheckingAuth(false);
        return;
      }

      // If user is authenticated but on email step, check what they need to complete
      if (user && step === "email") {
        setEmail(user.email ?? "");
        setUserId(user.id);

        // Check passkey/encryption status to determine next step
        const { step: requiredStep } = await getRequiredAuthStep(user.id);

        if (
          requiredStep === "encryption-setup" ||
          requiredStep === "passkey-signin"
        ) {
          // User needs to complete passkey flow - show appropriate step
          setStep(requiredStep);
          setCheckingAuth(false);
          return;
        }

        // requiredStep is "complete" - user has everything set up
        // This shouldn't normally happen (callback handles this),
        // but as a fallback, redirect to final destination
        if (redirectUri) {
          window.location.href = redirectUri;
          return;
        } else {
          // Default to helvety.com when no redirect_uri is provided
          window.location.href = "https://helvety.com";
          return;
        }
      }

      setCheckingAuth(false);
    };
    void init();
  }, [supabase, step, redirectUri]);

  // Handle email submission and branch by passkey availability.
  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        // Read-only check, no user record is created here
        const result = await checkEmail(email);

        if (!result.success) {
          setError(result.error ?? "Failed to check email");
          setIsLoading(false);
          return;
        }

        if (result.data?.hasPasskey) {
          // User with passkey - go directly to passkey sign-in
          setSkippedToPasskey(true);
          setIsNewUser(false);
          setStep("passkey-signin");
        } else {
          // No passkey path: attempt OTP directly. New users will be challenged
          // for geo confirmation by sendVerificationCode.
          setIsNewUser(false);
          const otpResult = await sendVerificationCode(csrfToken, email);
          if (!otpResult.success) {
            if (otpResult.error === "GEO_CONFIRMATION_REQUIRED") {
              setIsNewUser(true);
              setStep("geo-confirmation");
              setIsLoading(false);
              return;
            }
            setError(otpResult.error ?? "Failed to send verification email");
            setIsLoading(false);
            return;
          }
          setOtpCode("");
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setStep("verify-code");
        }
        setIsLoading(false);
      } catch (err) {
        logger.error("Email submission error:", err);
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    },
    [email, csrfToken]
  );

  // Handle geo confirmation for new users; creates user + sends OTP only after confirmation
  const handleGeoConfirm = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      // Now safe to create the user since they confirmed they are in Switzerland
      const result = await sendVerificationCode(csrfToken, email, {
        geoConfirmed: true,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to send verification email");
        setIsLoading(false);
        return;
      }

      setOtpCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("verify-code");
      setIsLoading(false);
    } catch (err) {
      logger.error("Geo confirmation error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }, [email, csrfToken]);

  // Handle OTP code verification
  const handleCodeVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const result = await verifyEmailCode(csrfToken, email, otpCode);

        if (!result.success) {
          setError(result.error ?? "Verification failed");
          setIsLoading(false);
          return;
        }

        if (result.data) {
          setUserId(result.data.userId);
          setStep(result.data.nextStep);
        }
        setIsLoading(false);
      } catch (err) {
        logger.error("Code verification error:", err);
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    },
    [email, otpCode, csrfToken]
  );

  // Handle resending OTP code
  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    setError("");
    setIsLoading(true);

    try {
      // Pass geoConfirmed for new users (they already confirmed in the previous step)
      const result = await sendVerificationCode(
        csrfToken,
        email,
        isNewUser ? { geoConfirmed: true } : undefined
      );

      if (!result.success) {
        setError(result.error ?? "Failed to resend code");
      } else {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setOtpCode("");
      }
      setIsLoading(false);
    } catch (err) {
      logger.error("Resend code error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }, [email, resendCooldown, isNewUser, csrfToken]);

  // Handle passkey sign in (for existing users or verification after setup)
  const handlePasskeySignIn = useCallback(async () => {
    if (!passkeySupported) {
      setError("Your browser doesn't support passkeys");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const origin = window.location.origin;

      // Get authentication options
      const optionsResult = await generatePasskeyAuthOptions(
        csrfToken,
        origin,
        redirectUri ?? undefined,
        { isMobile: isMobileDevice() }
      );
      if (!optionsResult.success) {
        setError(optionsResult.error);
        setIsLoading(false);
        return;
      }

      // Start WebAuthn authentication
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
        setIsLoading(false);
        return;
      }

      // Verify authentication
      const verifyResult = await verifyPasskeyAuthentication(
        csrfToken,
        authResponse,
        origin
      );
      if (!verifyResult.success) {
        setError(verifyResult.error);
        setIsLoading(false);
        return;
      }

      // Redirect to final destination (session already created server-side)
      window.location.href = verifyResult.data.redirectUrl;
    } catch (err) {
      logger.error("Passkey auth error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }, [passkeySupported, redirectUri, csrfToken]);

  // Complete auth after passkey verification
  const handleCompleteAuth = useCallback(() => {
    if (redirectUri) {
      window.location.href = redirectUri;
    } else if (process.env.NODE_ENV === "production") {
      window.location.href = "https://helvety.com";
    } else {
      router.push("/");
    }
  }, [redirectUri, router]);

  // Auto-trigger passkey authentication for existing users who skipped email verification
  useEffect(() => {
    if (
      step === "passkey-signin" &&
      skippedToPasskey &&
      passkeySupported &&
      !isLoading &&
      !hasAutoTriggered.current
    ) {
      hasAutoTriggered.current = true;
      // Small delay to allow UI to render first
      const timer = setTimeout(() => {
        void handlePasskeySignIn();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    step,
    skippedToPasskey,
    passkeySupported,
    isLoading,
    handlePasskeySignIn,
  ]);

  // Go back to email step
  const handleBack = () => {
    setStep("email");
    setError("");
    setIsLoading(false);
    setSkippedToPasskey(false);
    setIsNewUser(false);
    hasAutoTriggered.current = false;
    setOtpCode("");
    setResendCooldown(0);
  };

  // Determine current stepper step
  const currentAuthStep: AuthStep = (() => {
    if (step === "geo-confirmation") return "geo_confirmation";
    if (step === "email" || step === "verify-code") return "email";
    if (step === "passkey-signin" || step === "passkey-verify")
      return "sign_in";
    return "create_passkey";
  })();

  // Determine flow type for stepper display
  // From URL param (callback) or from having skipped to passkey after email submit
  const flowType: AuthFlowType =
    isNewUserParam === "false" || skippedToPasskey
      ? "returning_user"
      : "new_user";

  return {
    step,
    email,
    setEmail,
    error,
    isLoading,
    checkingAuth,
    passkeySupported,
    isMobile,
    userId,
    otpCode,
    setOtpCode,
    resendCooldown,
    skippedToPasskey,
    isNewUser,
    redirectUri,
    isNewUserParam,
    currentAuthStep,
    flowType,
    handleEmailSubmit,
    handleGeoConfirm,
    handleCodeVerify,
    handleResendCode,
    handlePasskeySignIn,
    handleCompleteAuth,
    handleBack,
  };
}
