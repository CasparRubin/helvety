"use client";

import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { generateKeyCheckValue } from "@helvety/shared/crypto/key-check";
import { storeMasterKey } from "@helvety/shared/crypto/key-storage";
import { registerPasskey } from "@helvety/shared/crypto/passkey";
import {
  deriveKeyFromPRF,
  PRF_VERSION,
} from "@helvety/shared/crypto/prf-key-derivation";
import { cachePRFSalt } from "@helvety/shared/crypto/prf-salt-cache";
import { logger } from "@helvety/shared/logger";
import { isValidRedirectUri } from "@helvety/shared/redirect-validation";
import { Button } from "@helvety/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import {
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  CloudUpload,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { saveKeyCheckValue } from "@/app/actions/encryption-actions";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@/app/actions/passkey-registration-actions";
import {
  AuthStepper,
  getSetupStep,
  type AuthFlowType,
} from "@/components/encryption-stepper";
import { useCSRF } from "@/hooks/use-csrf";
import { isMobileDevice } from "@/lib/device-utils";

/**
 * Props for the EncryptionSetup component
 */
interface EncryptionSetupProps {
  flowType?: AuthFlowType;
  redirectUri?: string;
  /** Authenticated user's ID, used to store the master key in IndexedDB */
  userId?: string;
}

/** Setup step for tracking progress through the flow */
type SetupStep = "initial" | "registering" | "complete";

/**
 * Component for setting up a passkey with encryption support.
 * Uses WebAuthn PRF extension to register a passkey that can derive encryption keys.
 * Also registers the passkey for authentication (passwordless login).
 *
 * Flow: initial → registering → complete (redirect)
 *
 * After passkey registration, the credential and PRF params are stored server-side.
 * The PRF salt is also cached in localStorage so that subsequent logins include
 * the PRF extension for single-touch encryption unlock (no separate passkey
 * prompt in E2EE apps like helvety.com/tasks or helvety.com/contacts).
 *
 * On Chrome 132+ (released January 2025) and other modern browsers, PRF output is returned
 * during registration itself. When available, the master encryption key is
 * derived and stored in IndexedDB immediately, so the user lands in E2EE apps
 * with encryption already unlocked (zero extra passkey touches). On older
 * browsers that only return { enabled } during registration, EncryptionGate
 * in E2EE apps handles a one-time fallback unlock on first visit.
 *
 * Device-aware: On mobile, passkey is created on this device (Face ID, fingerprint, PIN).
 * On desktop, user scans QR code with phone and uses the phone for passkey.
 */
export function EncryptionSetup({
  flowType = "new_user",
  redirectUri,
  userId,
}: EncryptionSetupProps) {
  const { prfSupported, prfSupportInfo, checkPRFSupport } =
    useEncryptionContext();
  const csrfToken = useCSRF();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);
  const [setupStep, setSetupStep] = useState<SetupStep>("initial");
  const [isMobile, setIsMobile] = useState(false);
  const setupInProgressRef = useRef(false);

  // Get the current auth step for the stepper
  const currentAuthStep = getSetupStep(setupStep);

  // Device detection for passkey flow (client-only, set on mount)
  useEffect(() => {
    const id = setTimeout(() => setIsMobile(isMobileDevice()), 0);
    return () => clearTimeout(id);
  }, []);

  // Check PRF support on mount
  useEffect(() => {
    const checkSupport = async () => {
      await checkPRFSupport();
      setIsCheckingSupport(false);
    };
    void checkSupport();
  }, [checkPRFSupport]);

  // Reset to initial state (used when cancelling during registration)
  const resetSetup = () => {
    setSetupStep("initial");
    setIsLoading(false);
    setError("");
    setupInProgressRef.current = false;
  };

  // Handle passkey registration and redirect
  const handleSetup = async () => {
    // Prevent double submission
    if (setupInProgressRef.current) return;
    setupInProgressRef.current = true;

    setError("");
    setIsLoading(true);

    try {
      const origin = window.location.origin;

      // Generate server-side registration options for auth (includes PRF salt)
      const serverOptions = await generatePasskeyRegistrationOptions(
        csrfToken,
        origin,
        {
          isMobile: isMobileDevice(),
        }
      );
      if (!serverOptions.success) {
        setError(serverOptions.error);
        resetSetup();
        return;
      }

      // Extract PRF salt from server options
      const prfSalt = serverOptions.data.prfSalt;

      // Show registering step UI before triggering WebAuthn
      setSetupStep("registering");

      let regResult;
      try {
        // Cast to allow PRF extension (not in standard types but supported by browsers)
        const optionsWithPRF = serverOptions.data as Parameters<
          typeof registerPasskey
        >[0] & {
          extensions?: Record<string, unknown>;
        };

        // Add PRF extension for encryption key derivation
        optionsWithPRF.extensions = {
          ...(optionsWithPRF.extensions ?? {}),
          prf: {
            eval: {
              first: new Uint8Array(Buffer.from(prfSalt, "base64")),
            },
          },
        };

        regResult = await registerPasskey(optionsWithPRF);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Passkey registration failed";
        // Check if user canceled
        if (err instanceof Error && err.name === "NotAllowedError") {
          setError("Passkey creation was canceled. Please try again.");
        } else {
          setError(message);
        }
        resetSetup();
        return;
      }

      if (!regResult.prfEnabled) {
        setError(
          "Your authenticator does not support encryption. Please try a different device."
        );
        resetSetup();
        return;
      }

      // Verify and store credential + PRF params on the server
      const verifyResult = await verifyPasskeyRegistration(
        csrfToken,
        regResult.response,
        origin,
        true // PRF was enabled
      );
      if (!verifyResult.success) {
        logger.error("Failed to store auth credential:", verifyResult.error);
        setError(
          verifyResult.error ?? "Failed to complete passkey registration"
        );
        resetSetup();
        return;
      }

      // Cache the PRF salt so future logins can include PRF for single-touch unlock
      cachePRFSalt(prfSalt, PRF_VERSION);

      // On Chrome 132+ (released January 2025), PRF output is returned during registration.
      // If available, derive and store the master key now so the user doesn't
      // need a separate passkey touch when EncryptionGate loads in E2EE apps.
      if (regResult.prfOutput && userId) {
        try {
          const prfParams = { prfSalt, version: PRF_VERSION };
          const masterKey = await deriveKeyFromPRF(
            regResult.prfOutput,
            prfParams
          );
          await storeMasterKey(userId, masterKey);

          // Generate and store a key check value so future unlock attempts
          // can detect if a wrong passkey (wrong key) was used.
          try {
            const kcv = await generateKeyCheckValue(masterKey);
            await saveKeyCheckValue(csrfToken, kcv);
          } catch (kcvError) {
            logger.warn(
              "Failed to save key check value during registration (will be generated on first unlock):",
              kcvError
            );
          }

          logger.info(
            "Master key derived and stored during passkey registration (zero extra touches)"
          );
        } catch (prfError) {
          // Non-fatal: EncryptionGate will handle unlock as fallback
          logger.warn(
            "Failed to derive master key from registration PRF output (will use fallback):",
            prfError
          );
        }
      }

      // Mark as complete and redirect
      setSetupStep("complete");

      // Validate redirect URI against allowlist to prevent open redirect attacks
      const destination =
        redirectUri && isValidRedirectUri(redirectUri)
          ? redirectUri
          : "https://helvety.com";
      window.location.href = destination;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      resetSetup();
    }
  };

  // Show loading while checking PRF support
  if (isCheckingSupport) {
    return (
      <div className="flex w-full max-w-md flex-col items-center">
        <AuthStepper flowType={flowType} currentStep="create_passkey" />
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unsupported message if PRF is not available
  if (prfSupported === false) {
    return (
      <div className="flex w-full max-w-md flex-col items-center">
        <AuthStepper flowType={flowType} currentStep="create_passkey" />
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Browser Not Supported</CardTitle>
            </div>
            <CardDescription>
              Your browser doesn&apos;t support passkey encryption with your
              phone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-500">
                {prfSupportInfo?.reason ??
                  "Phone passkey encryption is not supported"}
              </p>
            </div>
            <div className="text-muted-foreground text-sm">
              <p className="mb-2 font-medium">Supported browsers:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Chrome 128+ or Edge 128+ on desktop</li>
                <li>Safari 18+ on Mac</li>
                <li>Firefox 139+ on desktop</li>
              </ul>
              <p className="mt-3 mb-2 font-medium">Supported phones:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>iPhone with iOS 18+</li>
                <li>Android 14+ with Chrome</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registering state - waiting for passkey creation
  if (setupStep === "registering") {
    return (
      <div className="flex w-full max-w-md flex-col items-center">
        <AuthStepper flowType={flowType} currentStep={currentAuthStep} />
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              <CardTitle>Create Passkey</CardTitle>
            </div>
            <CardDescription>
              {isMobile
                ? "Save the passkey on this device"
                : "Save the passkey to your phone"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Loader2 className="text-primary h-5 w-5 animate-spin" />
                </div>
                <div>
                  <p className="font-medium">
                    {isMobile ? "Use this device" : "Scan QR Code"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {isMobile
                      ? "Use Face ID, fingerprint, or device PIN"
                      : "Use your phone to scan the QR code"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-2">
                <p className="text-muted-foreground text-sm">
                  {isMobile
                    ? "Create the passkey on this device using Face ID, fingerprint, or your device PIN."
                    : "Scan the QR code with your phone and save the passkey using Face ID or fingerprint."}
                </p>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <div className="flex items-center justify-center py-2">
              <p className="text-muted-foreground text-sm">
                {isMobile
                  ? "Waiting for verification..."
                  : "Waiting for your phone..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initial state - show setup introduction
  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <AuthStepper flowType={flowType} currentStep="create_passkey" />
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-5 w-5" />
            <CardTitle>Set Up Encryption</CardTitle>
          </div>
          <CardDescription>
            {isMobile
              ? "Secure your data with a passkey on this device (Face ID, fingerprint, or PIN)."
              : "Use your iPhone, iPad, or Android phone to secure your data with end-to-end encryption."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <div className="text-sm text-amber-500">
                <p className="font-medium">Important</p>
                <p className="mt-1 text-amber-500/80">
                  {isMobile
                    ? "Your passkey is the only way to decrypt your data. If you remove the passkey from this device, your data cannot be recovered."
                    : "Your passkey is the only way to decrypt your data. If you remove the passkey from your phone, your data cannot be recovered."}
                </p>
              </div>
            </div>
          </div>

          {/* Cloud sync recommendation */}
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
            <div className="flex gap-2">
              <CloudUpload className="h-5 w-5 flex-shrink-0 text-blue-500" />
              <div className="text-sm text-blue-500">
                <p className="font-medium">Recommended</p>
                <p className="mt-1 text-blue-500/80">
                  {isMobile
                    ? "When prompted, save your passkey using your device's built-in password manager — Passwords on iPhone or Google Password Manager on Android. These sync automatically to iCloud or your Google account, so if you ever lose or replace your device, your passkey is restored as soon as you sign in on a new one. Third-party password managers may also work, as long as they support passkey sync."
                    : "When saving your passkey, use your phone's built-in password manager — Passwords on iPhone or Google Password Manager on Android. These sync automatically to iCloud or your Google account, so if you ever lose or replace your phone, your passkey is restored as soon as you sign in on a new device. Third-party password managers may also work, as long as they support passkey sync."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Fingerprint className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">
                  {isMobile ? "Passkey on this device" : "Phone Passkey"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Secured with Face ID or fingerprint
                </p>
              </div>
            </div>
            <ul className="text-muted-foreground ml-13 space-y-1 text-sm">
              {isMobile ? (
                <>
                  <li>• Create passkey on this device</li>
                  <li>• Verify with Face ID, fingerprint, or device PIN</li>
                  <li>• Your data stays encrypted</li>
                </>
              ) : (
                <>
                  <li>• Scan QR code with your phone</li>
                  <li>• Verify with Face ID or fingerprint</li>
                  <li>• Your data stays encrypted</li>
                </>
              )}
            </ul>
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <Button
            onClick={handleSetup}
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                {isMobile ? "Set Up with This Device" : "Set Up with Phone"}
              </>
            )}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            {isMobile
              ? "You'll create a passkey on this device to secure your data."
              : "You'll scan a QR code with your phone to create a passkey."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
