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
import {
  getUserSingleflight,
  invalidateAuthUserProbeCache,
} from "@helvety/ui/auth-session-singleflight";
import { useCSRFToken, useSetCSRFToken } from "@helvety/ui/csrf-provider";
import { startAuthentication } from "@simplewebauthn/browser";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { resolveLoginEntryStep } from "@/lib/login-entry";
import {
  expectsExistingSessionOnBootstrap,
  isRateLimitedAuthMessage,
  mapPasskeyWebAuthnError,
  resolveBootstrapFriendlyError,
  shouldSurfaceLoginError,
} from "@/lib/login-flow-errors";
import {
  resolveLoginCurrentAuthStep,
  resolveLoginStepperMode,
} from "@/lib/login-flow-stepper";
import { syncLoginUrlStep } from "@/lib/login-url-sync";

import type { AuthStep, AuthStepperMode } from "@/components/auth-stepper";
import type {
  LoginErrorSource,
  PasskeyCeremonySource,
} from "@/lib/login-flow-errors";
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
  /** True after OTP verify succeeded — keeps passkey UI visible during soft post-action re-renders. */
  otpVerifySucceeded: boolean;
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
  return isRateLimitedAuthMessage(message);
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

/**
 * Returns true when an OTP verify response should update UI state.
 * When `requestId` is less than `latestRequestId`, the response is from a
 * superseded in-flight call and must be ignored so a late failure cannot toast
 * after a newer verify already succeeded or advanced the flow.
 */
export function shouldApplyOtpVerifyResponse(
  requestId: number,
  latestRequestId: number
): boolean {
  return requestId === latestRequestId;
}

/** Returns true when an OTP verify submit should be ignored (already done or in flight). */
export function shouldSkipOtpVerifySubmit(options: {
  otpVerifySucceeded: boolean;
  verifyCodeInProgress: boolean;
}): boolean {
  return options.otpVerifySucceeded || options.verifyCodeInProgress;
}

/** Full-page bootstrap spinner — suppressed after OTP during soft RSC re-renders (not full navigation). */
export function shouldShowLoginBootstrapSpinner(options: {
  checkingAuth: boolean;
  otpVerifySucceeded: boolean;
}): boolean {
  return options.checkingAuth && !options.otpVerifySucceeded;
}

/** Resolves user id for passkey-first bootstrap from trust probe and server hints. */
export function resolveTrustedBootstrapUserId(input: {
  trustTrusted: boolean;
  trustUserId: string | null;
  entryTrustedUserId: string | null;
  initialTrustedUserId: string | null;
}): string | null {
  return (
    (input.trustTrusted ? input.trustUserId : null) ??
    input.entryTrustedUserId ??
    input.initialTrustedUserId
  );
}

/**
 * Order of state updates after OTP success (after `invalidateAuthUserProbeCache`
 * and `hasAutoStartedPasskeySignIn` reset). URL sync runs after `setStep` via
 * `replaceState` so refresh/bookmark match without a server redirect.
 */
export const OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER = [
  "setCsrfToken",
  "setUserId",
  "setPostOtpPasskeyPath",
  "setStep",
  "syncLoginUrl",
] as const;

/** Options for {@link useLoginFlow} (server-provided login gate state). */
export type UseLoginFlowOptions = {
  initialStep: LoginStep;
  initialTrustedUserId: string | null;
  initialError?: string;
};

/** Parses `?step=` on `/auth/login` into a known login step, if valid. */
function parseUrlLoginStep(value: string | null): LoginStep | null {
  if (
    value === "email" ||
    value === "verify-code" ||
    value === "passkey-signin" ||
    value === "encryption-setup"
  ) {
    return value;
  }
  return null;
}

/** Hook encapsulating the entire login flow state and handlers. */
/**
 * Client login state machine: email → OTP → passkey (and optional encryption setup).
 * Runs a one-shot session bootstrap per mount; mobile may auto-start passkey after
 * OTP; desktop requires the passkey button (hybrid QR needs a user gesture).
 */
export function useLoginFlow(options: UseLoginFlowOptions): LoginFlowState {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);
  const csrfToken = useCSRFToken();
  const setCsrfToken = useSetCSRFToken();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [nonEUEEAConfirmed, setNonEUEEAConfirmed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [otpVerifySucceeded, setOtpVerifySucceeded] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(() =>
    isPasskeySupported()
  );

  // Get parameters from URL (validate redirect URI against allowlist to prevent open redirects)
  const rawRedirectUri = searchParams.get("redirect_uri");
  const redirectUri = isValidRedirectUri(rawRedirectUri)
    ? rawRedirectUri
    : null;
  const forceLogin = searchParams.get("force_login") === "1";
  const urlStep = parseUrlLoginStep(searchParams.get("step"));

  const [step, setStep] = useState<LoginStep>(options.initialStep);
  const [error, setError] = useState(options.initialError ?? "");
  const [userId, setUserId] = useState<string | null>(null);
  const [isMobile] = useState(() => isMobileDevice());
  const hasAutoRetriedMismatch = useRef(false);
  const hasAutoStartedPasskeySignIn = useRef(false);
  const hasRecoveredTerminalAuth = useRef(false);
  const verifyCodeInProgressRef = useRef(false);
  const verifyCodeRequestIdRef = useRef(0);
  const otpVerifySucceededRef = useRef(false);
  const initialBootstrapDoneRef = useRef(false);
  const stepRef = useRef<LoginStep>(options.initialStep);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  /** After OTP: direct to sign-in vs setup then sign-in (drives 3- vs 4-step stepper). */
  const [postOtpPasskeyPath, setPostOtpPasskeyPath] =
    useState<PostOtpPasskeyPath>(null);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const expectsSessionRestore = useMemo(
    () =>
      expectsExistingSessionOnBootstrap({
        initialStep: options.initialStep,
        initialTrustedUserId: options.initialTrustedUserId,
        initialError: options.initialError,
        urlStep,
      }),
    [
      options.initialError,
      options.initialStep,
      options.initialTrustedUserId,
      urlStep,
    ]
  );

  const surfaceLoginError = useCallback(
    (
      message: string,
      source: LoginErrorSource,
      extra?: {
        ceremonySource?: PasskeyCeremonySource;
        webAuthnErrorName?: string;
      }
    ) => {
      if (
        !shouldSurfaceLoginError({
          otpVerifySucceeded: otpVerifySucceededRef.current,
          step: stepRef.current,
          source,
          ceremonySource: extra?.ceremonySource,
          webAuthnErrorName: extra?.webAuthnErrorName,
        })
      ) {
        if (source === "passkey" && extra?.ceremonySource === "auto") {
          logger.warn("Suppressed auto-passkey WebAuthn error.", {
            message,
            webAuthnErrorName: extra.webAuthnErrorName,
          });
        }
        return;
      }
      setError(message);
      toast.error(message, { duration: TOAST_DURATIONS.ERROR });
    },
    []
  );

  const applyBootstrapError = useCallback(
    (message: string) => {
      if (otpVerifySucceededRef.current) {
        return;
      }
      const friendly = resolveBootstrapFriendlyError(
        message,
        expectsSessionRestore
      );
      if (!friendly) {
        return;
      }
      surfaceLoginError(friendly, "bootstrap");
    },
    [expectsSessionRestore, surfaceLoginError]
  );

  const syncCurrentLoginStepToUrl = useCallback(
    (loginStep: LoginStep) => {
      syncLoginUrlStep(loginStep, {
        redirectUri,
        forceLogin,
      });
    },
    [forceLogin, redirectUri]
  );

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize once per mount: passkey support and existing session probe.
  useEffect(() => {
    if (initialBootstrapDoneRef.current) {
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;
    let bootstrapCompleted = false;
    setCheckingAuth(true);

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
            applyBootstrapError(userError.message);
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
          if (!cancelled && !otpVerifySucceededRef.current) {
            surfaceLoginError(
              "Your session expired. Please sign in again.",
              "bootstrap"
            );
          }
          return;
        }

        let requiredAuthStep: "passkey-signin" | "encryption-setup" | null =
          null;
        if (user) {
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
              if (!otpVerifySucceededRef.current) {
                surfaceLoginError(
                  "Your session expired. Please sign in again.",
                  "bootstrap"
                );
              }
            }
            return;
          }

          if (probe.status === "unavailable") {
            if (!cancelled && !otpVerifySucceededRef.current) {
              surfaceLoginError(
                "We couldn't verify your sign-in status. Please try again in a moment.",
                "bootstrap"
              );
            }
            return;
          }

          if (probe.status === "ok") {
            requiredAuthStep = probe.step;
          }
        }

        const trustStatus = await getDeviceTrustStatus();
        const trust =
          trustStatus.success && trustStatus.data.trusted
            ? {
                trusted: true as const,
                userId: trustStatus.data.userId,
              }
            : { trusted: false as const, userId: null };

        const entry = resolveLoginEntryStep({
          urlStep,
          hasSession: Boolean(user),
          trust,
          forceLogin,
          requiredAuthStep,
          redirectUri,
        });

        if (entry.kind === "redirect") {
          window.location.href = entry.redirectTo;
          return;
        }

        if (!cancelled && !otpVerifySucceededRef.current) {
          if (user) {
            setEmail(user.email ?? "");
            setUserId(user.id);
          } else {
            const trustedUserId = resolveTrustedBootstrapUserId({
              trustTrusted: trust.trusted,
              trustUserId: trust.userId,
              entryTrustedUserId: entry.trustedUserId,
              initialTrustedUserId: options.initialTrustedUserId,
            });
            if (trustedUserId) {
              setUserId(trustedUserId);
            }
          }
          setStep(entry.step);
          if (user && requiredAuthStep) {
            const bootstrap = resolveAuthenticatedEmailBootstrap({
              requiredStep: requiredAuthStep,
            });
            setPostOtpPasskeyPath(
              bootstrap.step === "passkey-signin"
                ? "direct_signin"
                : "setup_then_signin"
            );
          }
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
          applyBootstrapError(message);
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
          initialBootstrapDoneRef.current = true;
          bootstrapCompleted = true;
        }
      }
    };
    void init();

    return () => {
      cancelled = true;
      // Strict Mode remount: allow bootstrap to rerun if the prior run was aborted.
      if (!bootstrapCompleted) {
        initialBootstrapDoneRef.current = false;
      }
    };
  }, [
    applyBootstrapError,
    forceLogin,
    options.initialTrustedUserId,
    redirectUri,
    surfaceLoginError,
    supabase,
    urlStep,
  ]);

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
          surfaceLoginError(msg, "email");
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
        surfaceLoginError(msg, "email");
        setIsLoading(false);
      }
    },
    [email, csrfToken, nonEUEEAConfirmed, surfaceLoginError]
  );

  // Handle OTP code verification
  const handleCodeVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (
        shouldSkipOtpVerifySubmit({
          otpVerifySucceeded: otpVerifySucceededRef.current,
          verifyCodeInProgress: verifyCodeInProgressRef.current,
        })
      ) {
        return;
      }
      verifyCodeInProgressRef.current = true;

      // Ignore responses superseded by a newer submit (same code consumed twice).
      const requestId = ++verifyCodeRequestIdRef.current;

      setError("");
      setIsLoading(true);

      try {
        const result = await verifyEmailCode(csrfToken, email, otpCode);

        // Discard result if a newer request has already claimed ownership
        if (
          !shouldApplyOtpVerifyResponse(
            requestId,
            verifyCodeRequestIdRef.current
          )
        )
          return;

        if (!result.success) {
          const msg = result.error ?? "Verification failed";
          surfaceLoginError(msg, "otp");
          return;
        }

        if (result.data) {
          otpVerifySucceededRef.current = true;
          setOtpVerifySucceeded(true);
          setCheckingAuth(false);
          invalidateAuthUserProbeCache();
          setError("");
          hasAutoStartedPasskeySignIn.current = false;
          setCsrfToken(result.data.csrfToken);
          setUserId(result.data.userId);
          setPostOtpPasskeyPath(
            result.data.nextStep === "passkey-signin"
              ? "direct_signin"
              : "setup_then_signin"
          );
          setStep(result.data.nextStep);
          syncCurrentLoginStepToUrl(result.data.nextStep);
          if (!result.data.deviceTrustMinted) {
            toast.warning(
              "This device wasn't remembered. You may need email verification again next time.",
              { duration: TOAST_DURATIONS.ERROR }
            );
          }
        }
      } catch (err) {
        if (
          !shouldApplyOtpVerifyResponse(
            requestId,
            verifyCodeRequestIdRef.current
          )
        )
          return;
        logger.logUnexpectedError("Code verification error", err);
        const msg = "Couldn't verify your code. Please try again.";
        surfaceLoginError(msg, "otp");
      } finally {
        verifyCodeInProgressRef.current = false;
        if (
          shouldApplyOtpVerifyResponse(
            requestId,
            verifyCodeRequestIdRef.current
          )
        ) {
          setIsLoading(false);
        }
      }
    },
    [
      email,
      otpCode,
      csrfToken,
      setCsrfToken,
      surfaceLoginError,
      syncCurrentLoginStepToUrl,
    ]
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
        surfaceLoginError(msg, "otp");
      } else {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setOtpCode("");
      }
      setIsLoading(false);
    } catch (err) {
      logger.logUnexpectedError("Resend code error", err);
      const msg = "Couldn't resend the code. Please try again.";
      surfaceLoginError(msg, "otp");
      setIsLoading(false);
    }
  }, [email, resendCooldown, nonEUEEAConfirmed, csrfToken, surfaceLoginError]);

  const clearStalePasskeyBootstrapState = useCallback(async () => {
    clearCachedPRFSalt();
    await clearAllKeys();
  }, []);

  // Handle passkey sign-in (for existing users or verification after setup)
  // Includes PRF extension to enable single-touch encryption unlock by deriving a master key
  // when PRF output is available (server-provided PRF params preferred, local fallback).
  const runPasskeySignIn = useCallback(
    async (ceremonySource: PasskeyCeremonySource) => {
      if (!passkeySupported) {
        const msg = "Your browser does not support passkeys in this flow";
        surfaceLoginError(msg, "passkey", { ceremonySource });
        return;
      }

      hasAutoRetriedMismatch.current = false;
      setError("");
      setIsLoading(true);

      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          const origin = window.location.origin;

          const optionsResult = await generatePasskeyAuthOptions(
            csrfToken,
            origin,
            redirectUri ?? undefined,
            {
              isMobile: isMobileDevice(),
              expectedEmail: email ? email.toLowerCase().trim() : undefined,
            }
          );
          if (!optionsResult.success) {
            const msg = optionsResult.error ?? "Failed to load passkey options";
            surfaceLoginError(msg, "passkey", { ceremonySource });
            setIsLoading(false);
            return;
          }

          const authOptions = optionsResult.data;

          let bootstrapSalt = getCachedPRFSalt();
          let bootstrapSaltFromServer = false;

          const passkeyParamsResult = await getPasskeyParams();
          if (
            passkeyParamsResult.success &&
            passkeyParamsResult.data?.prf_salt
          ) {
            bootstrapSalt = {
              prfSalt: passkeyParamsResult.data.prf_salt,
              version: passkeyParamsResult.data.version,
              cachedAt: Date.now(),
            };
            bootstrapSaltFromServer = true;
          }

          if (bootstrapSalt) {
            const saltBytes = Uint8Array.from(
              atob(bootstrapSalt.prfSalt),
              (c) => c.charCodeAt(0)
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

          let authResponse;
          try {
            authResponse = await startAuthentication({
              optionsJSON: authOptions,
            });
          } catch (err) {
            const { message, errorName } = mapPasskeyWebAuthnError(err);
            surfaceLoginError(message, "passkey", {
              ceremonySource,
              webAuthnErrorName: errorName,
            });
            setIsLoading(false);
            if (ceremonySource === "user") {
              hasAutoStartedPasskeySignIn.current = false;
            }
            return;
          }

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
              surfaceLoginError(mismatchMsg, "passkey", { ceremonySource });
              hasAutoRetriedMismatch.current = false;
            } else {
              const msg = verifyResult.error ?? "Passkey verification failed";
              surfaceLoginError(msg, "passkey", { ceremonySource });
              hasAutoRetriedMismatch.current = false;
            }
            setIsLoading(false);
            return;
          }

          hasAutoRetriedMismatch.current = false;

          // If PRF output was received, derive and cache the master encryption key.
          if (bootstrapSalt) {
            try {
              const clientExtResults = authResponse.clientExtensionResults as {
                prf?: { results?: { first?: ArrayBuffer } };
              };
              const prfOutput = clientExtResults?.prf?.results?.first;

              if (prfOutput) {
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
                  const masterKey = await deriveKeyFromPRF(
                    prfOutput,
                    prfParams
                  );

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
                      surfaceLoginError(
                        "This passkey does not match your encryption key. Please use the passkey for this account.",
                        "passkey",
                        { ceremonySource }
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
              logger.warn(
                "Failed to derive encryption key during login (will continue in /auth flow):",
                prfError
              );
            }
          }

          window.location.href = verifyResult.data.redirectUrl;
          return;
        }
      } catch (err) {
        logger.logUnexpectedError("Passkey auth error", err);
        const msg = "Passkey sign-in failed. Please try again.";
        surfaceLoginError(msg, "passkey", { ceremonySource });
        setIsLoading(false);
      }
    },
    [
      clearStalePasskeyBootstrapState,
      csrfToken,
      email,
      passkeySupported,
      redirectUri,
      surfaceLoginError,
    ]
  );

  const handlePasskeySignIn = useCallback(() => {
    return runPasskeySignIn("user");
  }, [runPasskeySignIn]);

  const handlePasskeyRegistrationComplete = useCallback(() => {
    setPostOtpPasskeyPath("setup_then_signin");
    setStep("passkey-signin");
    syncCurrentLoginStepToUrl("passkey-signin");
    setError("");
    hasAutoStartedPasskeySignIn.current = false;
  }, [syncCurrentLoginStepToUrl]);

  // After OTP or trusted-device entry on mobile, start passkey once bootstrap finishes.
  // Desktop uses WebAuthn `hints: ["hybrid"]` (QR); ceremonies require a user gesture
  // (see W3C WebAuthn / SimpleWebAuthn) — use the sign-in button instead of auto-start.
  useEffect(() => {
    if (
      checkingAuth ||
      step !== "passkey-signin" ||
      isLoading ||
      !passkeySupported ||
      !isMobile
    ) {
      return;
    }
    if (!userId && !options.initialTrustedUserId) {
      return;
    }
    if (hasAutoStartedPasskeySignIn.current) {
      return;
    }
    hasAutoStartedPasskeySignIn.current = true;
    void runPasskeySignIn("auto");
  }, [
    checkingAuth,
    isLoading,
    isMobile,
    options.initialTrustedUserId,
    passkeySupported,
    runPasskeySignIn,
    step,
    userId,
  ]);

  const handleBack = () => {
    setStep("email");
    setError("");
    setIsLoading(false);
    setNonEUEEAConfirmed(false);
    setOtpCode("");
    setResendCooldown(0);
    setPostOtpPasskeyPath(null);
    hasAutoRetriedMismatch.current = false;
    hasAutoStartedPasskeySignIn.current = false;
    otpVerifySucceededRef.current = false;
    setOtpVerifySucceeded(false);
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
    otpVerifySucceeded,
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
