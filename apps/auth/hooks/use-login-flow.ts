"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  generateKeyCheckValue,
  verifyKeyCheckValue,
} from "@helvety/shared/crypto/key-check";
import {
  clearAllKeys,
  storeMasterKey,
} from "@helvety/shared/crypto/key-storage";
import { isPasskeySupported } from "@helvety/shared/crypto/passkey";
import {
  deriveKeyFromPRF,
  type PRFKeyParams,
} from "@helvety/shared/crypto/prf-key-derivation";
import {
  getCachedPRFSalt,
  cachePRFSalt,
  clearCachedPRFSalt,
} from "@helvety/shared/crypto/prf-salt-cache";
import { logger } from "@helvety/shared/logger";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { createBrowserClient } from "@helvety/shared/supabase/client";
import { getUserSingleflight } from "@helvety/ui/auth-session-singleflight";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { startAuthentication } from "@simplewebauthn/browser";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getDeviceTrustStatus } from "@/app/actions/device-trust-actions";
import {
  getPasskeyParams,
  saveKeyCheckValue,
} from "@/app/actions/encryption-actions";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "@/app/actions/otp-actions";
import {
  generatePasskeyAuthOptions,
  verifyPasskeyAuthentication,
} from "@/app/actions/passkey-auth-actions";
import { getRequiredAuthStep } from "@/lib/auth-utils";
import { isMobileDevice } from "@/lib/device-utils";
import { resolveAuthenticatedEmailBootstrap } from "@/lib/login-email-bootstrap";
import {
  resolveLoginCurrentAuthStep,
  resolveLoginStepperMode,
} from "@/lib/login-flow-stepper";

import type {
  AuthStep,
  AuthStepperMode,
} from "@/components/encryption-stepper";
import type { LoginStep, PostOtpPasskeyPath } from "@/lib/login-flow-stepper";

/** Duration (in seconds) before the user can resend an OTP code. */
const RESEND_COOLDOWN_SECONDS = 120;
const LOGIN_AUTH_PROBE_TIMEOUT_MS = 1_200;
const TERMINAL_AUTH_ERROR_TOKENS = [
  "refresh token not found",
  "invalid refresh token",
  "refresh token is invalid",
  "session is invalid",
] as const;
const RATE_LIMIT_AUTH_ERROR_TOKENS = [
  "too many requests",
  "request rate limit reached",
  "429",
] as const;
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  missing_params: "Invalid authentication link.",
  logout_failed: "We couldn't complete sign-out. Please sign in and try again.",
  rate_limited:
    "Too many sign-in attempts. Please wait a moment and try again.",
  missing_client_ip: "We couldn't verify your connection. Please try again.",
  server_error: "Authentication is temporarily unavailable. Please try again.",
  invalid_type:
    "This verification link is invalid or expired. Please request a new sign-in code and try again.",
  invalid_otp_type:
    "This verification link is invalid or expired. Please request a new sign-in code and try again.",
};

/** Return type of the useLoginFlow hook */
interface LoginFlowState {
  step: LoginStep;
  email: string;
  setEmail: (email: string) => void;
  nonEUEEAConfirmed: boolean;
  setNonEUEEAConfirmed: (checked: boolean) => void;
  error: string;
  isLoading: boolean;
  checkingAuth: boolean;
  passkeySupported: boolean;
  isMobile: boolean;
  userId: string | null;
  otpCode: string;
  setOtpCode: (code: string) => void;
  resendCooldown: number;
  redirectUri: string | null;
  currentAuthStep: AuthStep;
  /** Stepper layout: 4 steps before OTP; after OTP either 3 (skip setup) or 4 (full). */
  stepperMode: AuthStepperMode;
  handleEmailSubmit: (e: React.FormEvent) => Promise<void>;
  handleCodeVerify: (e: React.FormEvent) => Promise<void>;
  handleResendCode: () => Promise<void>;
  handlePasskeySignIn: () => Promise<void>;
  /** After passkey registration (step 3), continue to passkey sign-in (step 4). */
  handlePasskeyRegistrationComplete: () => void;
  handleBack: () => void;
}

/** Returns true when auth failure likely needs a local session reset. */
export function shouldResetLoginAuthSession(message: string | null): boolean {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return TERMINAL_AUTH_ERROR_TOKENS.some((token) => normalized.includes(token));
}

/** Returns true when auth failures indicate temporary rate-limiting. */
export function isRateLimitedLoginAuthSession(message: string | null): boolean {
  if (!message) {
    return false;
  }
  const normalized = message.toLowerCase();
  return RATE_LIMIT_AUTH_ERROR_TOKENS.some((token) =>
    normalized.includes(token)
  );
}

/** Wraps auth probe calls so login can recover from indefinite hangs. */
export async function withLoginAuthProbeTimeout<T>(
  promise: Promise<T>,
  timeoutMs = LOGIN_AUTH_PROBE_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("AUTH_PROBE_TIMEOUT"));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/** Hook encapsulating the entire login flow state and handlers. */
export function useLoginFlow(): LoginFlowState {
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();
  const csrfToken = useCSRFToken();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [nonEUEEAConfirmed, setNonEUEEAConfirmed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Get parameters from URL (validate redirect URI against allowlist to prevent open redirects)
  const rawRedirectUri = searchParams.get("redirect_uri");
  const redirectUri = isValidRedirectUri(rawRedirectUri)
    ? rawRedirectUri
    : null;
  const forceLogin = searchParams.get("force_login") === "1";
  const stepParam = searchParams.get("step") as LoginStep | null;
  const authError = searchParams.get("error");

  // Compute initial step from URL or default to email
  const initialStep: LoginStep =
    stepParam === "passkey-signin" || stepParam === "encryption-setup"
      ? stepParam
      : "email";

  // Compute initial error from URL
  const initialError = authError ? (AUTH_ERROR_MESSAGES[authError] ?? "") : "";

  const [step, setStep] = useState<LoginStep>(initialStep);
  const [error, setError] = useState(initialError);
  const [userId, setUserId] = useState<string | null>(null);
  const [trustedUserId, setTrustedUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const hasAutoRetriedMismatch = useRef(false);
  const lastAuthBootstrapKey = useRef<string | null>(null);
  const hasRecoveredTerminalAuth = useRef(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  /** After OTP: direct to sign-in vs setup then sign-in (drives 3- vs 4-step stepper). */
  const [postOtpPasskeyPath, setPostOtpPasskeyPath] =
    useState<PostOtpPasskeyPath>(null);
  const authBootstrapKey = `${step}|${redirectUri ?? ""}|${forceLogin ? "1" : "0"}`;

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
    if (lastAuthBootstrapKey.current === authBootstrapKey) {
      return;
    }
    lastAuthBootstrapKey.current = authBootstrapKey;
    let cancelled = false;

    const init = async () => {
      try {
        // Check WebAuthn support
        const supported = isPasskeySupported();
        if (!cancelled) {
          setPasskeySupported(supported);
        }

        // Get current user if any
        const {
          data: { user },
          error: userError,
        } = await withLoginAuthProbeTimeout(
          getUserSingleflight(supabase, {
            cooldownMs: 1_500,
          })
        );

        if (
          userError?.message &&
          isRateLimitedLoginAuthSession(userError.message)
        ) {
          if (!cancelled) {
            setError(
              "Authentication is temporarily rate-limited. Please wait a few seconds and try again."
            );
          }
          return;
        }

        if (
          userError?.message &&
          shouldResetLoginAuthSession(userError.message)
        ) {
          if (!hasRecoveredTerminalAuth.current) {
            hasRecoveredTerminalAuth.current = true;
            await supabase.auth.signOut({ scope: "local" });
          }
          if (!cancelled) {
            setError("Your session expired. Please sign in again.");
          }
          return;
        }

        // Step-specific URLs are only valid with an authenticated session.
        // If the session is missing, restart from email (full login flow).
        if (
          !user &&
          (step === "passkey-signin" || step === "encryption-setup")
        ) {
          if (step === "passkey-signin") {
            const trust = await getDeviceTrustStatus();
            const isTrusted = trust.success && trust.data.trusted;
            if (!cancelled) {
              if (isTrusted) {
                setTrustedUserId(trust.data.userId);
                setStep("passkey-signin");
              } else {
                setStep("email");
              }
            }
            return;
          }
          if (!cancelled) setStep("email");
          return;
        }

        // If user is authenticated and we're on passkey or encryption step, stay on that step
        if (
          user &&
          (step === "passkey-signin" || step === "encryption-setup")
        ) {
          if (!cancelled) {
            setEmail(user.email ?? "");
            setUserId(user.id);
            setTrustedUserId(null);
          }
          return;
        }

        // If user is authenticated but on email step, check what they need to complete
        if (user && step === "email") {
          if (!cancelled) {
            setEmail(user.email ?? "");
            setUserId(user.id);
            setTrustedUserId(null);
          }

          const probe = await getRequiredAuthStep();

          if (probe.status === "not_authenticated") {
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch (signOutError) {
              logger.warn(
                "Local auth sign-out after server reported no session.",
                {
                  message:
                    signOutError instanceof Error
                      ? signOutError.message
                      : String(signOutError),
                }
              );
            }
            if (!cancelled) {
              setUserId(null);
              setError("Your session expired. Please sign in again.");
            }
            return;
          }

          if (probe.status === "unavailable") {
            if (!cancelled) {
              setError(
                "We couldn't verify your sign-in status. Please try again in a moment."
              );
            }
            return;
          }

          const action = resolveAuthenticatedEmailBootstrap({
            requiredStep: probe.step,
          });
          if (!cancelled) {
            setPostOtpPasskeyPath(
              action.step === "passkey-signin"
                ? "direct_signin"
                : "setup_then_signin"
            );
            setStep(action.step);
          }
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(
          "Login auth bootstrap failed; falling back to manual sign-in.",
          {
            message,
          }
        );

        if (shouldResetLoginAuthSession(message)) {
          if (!hasRecoveredTerminalAuth.current) {
            hasRecoveredTerminalAuth.current = true;
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch (signOutError) {
              logger.warn("Local auth sign-out during login recovery failed.", {
                message:
                  signOutError instanceof Error
                    ? signOutError.message
                    : String(signOutError),
              });
            }
          }
        }

        if (!cancelled) {
          const friendlyError =
            message === "AUTH_PROBE_TIMEOUT"
              ? "We could not restore your session in time. Please sign in."
              : isRateLimitedLoginAuthSession(message)
                ? "Authentication is temporarily rate-limited. Please wait a few seconds and try again."
                : "We could not restore your session. Please sign in.";
          setError(friendlyError);
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    };
    void init();

    return () => {
      cancelled = true;
    };
  }, [authBootstrapKey, forceLogin, redirectUri, step, supabase]);

  // Handle email submission; on success continue to OTP verification.
  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const result = await sendVerificationCode(csrfToken, email, {
          nonEUEEAConfirmed,
        });
        if (!result.success) {
          const msg =
            result.error ??
            "Failed to send verification code. Please try again.";
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
          setIsLoading(false);
          return;
        }

        setOtpCode("");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setStep("verify-code");
        setIsLoading(false);
      } catch (err) {
        logger.logUnexpectedError("Email submission error", err);
        const msg = "Couldn't send your verification code. Please try again.";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setIsLoading(false);
      }
    },
    [email, csrfToken, nonEUEEAConfirmed]
  );

  // Handle OTP code verification
  const handleCodeVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const result = await verifyEmailCode(csrfToken, email, otpCode);

        if (!result.success) {
          const msg = result.error ?? "Verification failed";
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
          setIsLoading(false);
          return;
        }

        if (result.data) {
          setUserId(result.data.userId);
          setPostOtpPasskeyPath(
            result.data.nextStep === "passkey-signin"
              ? "direct_signin"
              : "setup_then_signin"
          );
          setStep(result.data.nextStep);
        }
        setIsLoading(false);
      } catch (err) {
        logger.logUnexpectedError("Code verification error", err);
        const msg = "Couldn't verify your code. Please try again.";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
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
      const result = await sendVerificationCode(csrfToken, email, {
        nonEUEEAConfirmed,
      });

      if (!result.success) {
        const msg = result.error ?? "Failed to resend code";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      } else {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setOtpCode("");
      }
      setIsLoading(false);
    } catch (err) {
      logger.logUnexpectedError("Resend code error", err);
      const msg = "Couldn't resend the code. Please try again.";
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setIsLoading(false);
    }
  }, [email, resendCooldown, nonEUEEAConfirmed, csrfToken]);

  const clearStalePasskeyBootstrapState = useCallback(async () => {
    clearCachedPRFSalt();
    await clearAllKeys();
  }, []);

  // Handle passkey sign-in (for existing users or verification after setup)
  // Includes PRF extension to enable single-touch encryption unlock by deriving a master key
  // when PRF output is available (server-provided PRF params preferred, local fallback).
  const handlePasskeySignIn = useCallback(async () => {
    if (!passkeySupported) {
      const msg = "Your browser does not support passkeys in this flow";
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      return;
    }

    hasAutoRetriedMismatch.current = false;
    setError("");
    setIsLoading(true);

    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const origin = window.location.origin;

        // Get authentication options from server
        const optionsResult = await generatePasskeyAuthOptions(
          csrfToken,
          origin,
          redirectUri ?? undefined,
          {
            isMobile: isMobileDevice(),
            expectedEmail: email ? email.toLowerCase().trim() : undefined,
            expectedUserId: !email && trustedUserId ? trustedUserId : undefined,
          }
        );
        if (!optionsResult.success) {
          const msg = optionsResult.error ?? "Failed to load passkey options";
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
          setIsLoading(false);
          return;
        }

        // Resolve PRF bootstrap params for the WebAuthn PRF extension.
        // Prefer server-provided PRF params (authoritative, avoids stale local cache),
        // but fall back to localStorage for resilience.
        const authOptionsResult = optionsResult.data;
        const authOptions = authOptionsResult;

        let bootstrapSalt = getCachedPRFSalt();
        let bootstrapSaltFromServer = false;

        const passkeyParamsResult = await getPasskeyParams();
        if (passkeyParamsResult.success && passkeyParamsResult.data?.prf_salt) {
          bootstrapSalt = {
            prfSalt: passkeyParamsResult.data.prf_salt,
            version: passkeyParamsResult.data.version,
            cachedAt: Date.now(),
          };
          bootstrapSaltFromServer = true;
        }

        if (bootstrapSalt) {
          // Add PRF extension to the authentication options
          const saltBytes = Uint8Array.from(atob(bootstrapSalt.prfSalt), (c) =>
            c.charCodeAt(0)
          );
          Object.assign(authOptions, {
            extensions: {
              ...authOptions.extensions,
              prf: {
                eval: {
                  first: saltBytes,
                },
              },
            },
          });
        }

        // Start WebAuthn authentication (with PRF when bootstrap salt exists)
        let authResponse;
        try {
          authResponse = await startAuthentication({
            optionsJSON: authOptions,
          });
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.name === "NotAllowedError"
                ? "Authentication was canceled"
                : err.name === "AbortError"
                  ? "Authentication timed out"
                  : "Failed to authenticate with passkey"
              : "Failed to authenticate with passkey";
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
          setIsLoading(false);
          return;
        }

        // Verify authentication server-side. Forward only required WebAuthn
        // fields to avoid sending client extension results (PRF output, etc.).
        const authResponseForServer = {
          id: authResponse.id,
          rawId: authResponse.rawId,
          type: authResponse.type,
          response: authResponse.response,
        };
        const verifyResult = await verifyPasskeyAuthentication(
          csrfToken,
          authResponseForServer,
          origin
        );
        if (!verifyResult.success) {
          if (
            verifyResult.error === "PASSKEY_ACCOUNT_MISMATCH" &&
            attempt === 0
          ) {
            hasAutoRetriedMismatch.current = true;
            await clearStalePasskeyBootstrapState();
            setError(
              "We detected a passkey mismatch and are retrying for your selected account."
            );
            continue;
          }

          if (verifyResult.error === "PASSKEY_ACCOUNT_MISMATCH") {
            const mismatchMsg = email
              ? "This passkey belongs to a different account. Please use the passkey for the email you entered."
              : "This passkey belongs to a different account. Please try a different passkey, or sign in with email.";
            setError(mismatchMsg);
            toast.error(mismatchMsg, { duration: TOAST_DURATIONS.ERROR });
            hasAutoRetriedMismatch.current = false;
          } else {
            const msg = verifyResult.error ?? "Passkey verification failed";
            setError(msg);
            toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
            hasAutoRetriedMismatch.current = false;
          }
          setIsLoading(false);
          return;
        }

        hasAutoRetriedMismatch.current = false;

        // If PRF output was received, derive and cache the master encryption key.
        // This enables instant encryption unlock in E2EE apps
        // (tasks, contacts, notes)
        // without requiring a separate passkey touch.
        //
        // Security: The cached PRF salt may belong to a different user than the
        // one who actually authenticated (e.g., user entered Account A's email
        // but signed in with Account B's passkey). We must verify the cached
        // salt matches the authenticated user's actual params before deriving.
        if (bootstrapSalt) {
          try {
            const clientExtResults = authResponse.clientExtensionResults as {
              prf?: { results?: { first?: ArrayBuffer } };
            };
            const prfOutput = clientExtResults?.prf?.results?.first;

            if (prfOutput) {
              // Fetch the authenticated user's actual PRF params from the server
              // and verify the cached salt matches before deriving the key.
              const paramsResult = await getPasskeyParams();
              const actualSalt = paramsResult.success
                ? paramsResult.data?.prf_salt
                : null;

              const saltMatches = actualSalt
                ? actualSalt === bootstrapSalt.prfSalt
                : bootstrapSaltFromServer;

              if (saltMatches) {
                const prfParams: PRFKeyParams = {
                  prfSalt: bootstrapSalt.prfSalt,
                  version: bootstrapSalt.version,
                };
                const masterKey = await deriveKeyFromPRF(prfOutput, prfParams);

                const keyCheckValue = paramsResult.success
                  ? paramsResult.data?.key_check_value
                  : null;
                if (keyCheckValue) {
                  const isValidKey = await verifyKeyCheckValue(
                    masterKey,
                    keyCheckValue
                  );
                  if (!isValidKey) {
                    await clearStalePasskeyBootstrapState();
                    setError(
                      "This passkey does not match your encryption key. Please use the passkey for this account."
                    );
                    toast.error(
                      "Passkey mismatch detected. Please try the correct passkey.",
                      { duration: TOAST_DURATIONS.ERROR }
                    );
                    setIsLoading(false);
                    return;
                  }
                } else {
                  try {
                    const newKeyCheckValue =
                      await generateKeyCheckValue(masterKey);
                    await saveKeyCheckValue(csrfToken, newKeyCheckValue);
                  } catch (kcvError) {
                    logger.warn(
                      "Unable to save key check value during login bootstrap:",
                      kcvError
                    );
                  }
                }

                await storeMasterKey(verifyResult.data.userId, masterKey);

                cachePRFSalt(bootstrapSalt.prfSalt, bootstrapSalt.version);

                logger.info(
                  "Encryption key derived and cached during login (single-touch unlock)"
                );
              } else {
                // If we couldn't verify the salt (actualSalt missing) we still avoid
                // deriving from potentially stale local cache to prevent lockouts.
                clearCachedPRFSalt();

                if (!actualSalt) {
                  logger.warn(
                    "PRF salt verification unavailable; discarding cached salt to avoid deriving with potentially stale data."
                  );
                } else {
                  logger.warn(
                    "Cached PRF salt does not match authenticated user - skipping key derivation"
                  );
                }
              }
            }
          } catch (prfError) {
            // PRF key derivation failure is non-fatal. After redirect, /auth
            // continues the required passkey/encryption step if still needed.
            logger.warn(
              "Failed to derive encryption key during login (will continue in /auth flow):",
              prfError
            );
          }
        }

        // Redirect to final destination (session already created server-side)
        window.location.href = verifyResult.data.redirectUrl;
        return;
      }
    } catch (err) {
      logger.logUnexpectedError("Passkey auth error", err);
      const msg = "Passkey sign-in failed. Please try again.";
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setIsLoading(false);
    }
  }, [
    clearStalePasskeyBootstrapState,
    csrfToken,
    email,
    passkeySupported,
    redirectUri,
    trustedUserId,
  ]);

  const handlePasskeyRegistrationComplete = useCallback(() => {
    setPostOtpPasskeyPath("setup_then_signin");
    setStep("passkey-signin");
    setError("");
  }, []);

  const handleBack = () => {
    setStep("email");
    setError("");
    setIsLoading(false);
    setNonEUEEAConfirmed(false);
    setOtpCode("");
    setResendCooldown(0);
    setPostOtpPasskeyPath(null);
    hasAutoRetriedMismatch.current = false;
  };

  const currentAuthStep: AuthStep = resolveLoginCurrentAuthStep(step);
  const stepperMode: AuthStepperMode = resolveLoginStepperMode(
    step,
    postOtpPasskeyPath
  );

  return {
    step,
    email,
    setEmail,
    nonEUEEAConfirmed,
    setNonEUEEAConfirmed,
    error,
    isLoading,
    checkingAuth,
    passkeySupported,
    isMobile,
    userId,
    otpCode,
    setOtpCode,
    resendCooldown,
    redirectUri,
    currentAuthStep,
    stepperMode,
    handleEmailSubmit,
    handleCodeVerify,
    handleResendCode,
    handlePasskeySignIn,
    handlePasskeyRegistrationComplete,
    handleBack,
  };
}
