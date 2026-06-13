import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER } from "./use-login-flow";

const hookPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "use-login-flow.ts"
);

/** Reads `use-login-flow.ts` for wiring guardrail assertions. */
function readHookSource(): string {
  return readFileSync(hookPath, "utf8");
}

/** Extracts the OTP verify success handler block from hook source. */
function otpVerifySuccessBlock(src: string): string {
  const successBlockStart = src.indexOf("if (result.data) {");
  const successBlockEnd = src.indexOf("} catch (err)", successBlockStart);
  expect(successBlockStart).toBeGreaterThan(-1);
  expect(successBlockEnd).toBeGreaterThan(successBlockStart);
  return src.slice(successBlockStart, successBlockEnd);
}

describe("use-login-flow OTP verify wiring", () => {
  const src = readHookSource();

  it("imports useSetCSRFToken and syncs rotated token before advancing step", () => {
    expect(src).toContain("useSetCSRFToken");
    expect(src).toContain("setCsrfToken(result.data.csrfToken)");

    const csrfIdx = src.indexOf("setCsrfToken(result.data.csrfToken)");
    const stepIdx = src.indexOf("setStep(result.data.nextStep)");

    expect(csrfIdx).toBeGreaterThan(-1);
    expect(stepIdx).toBeGreaterThan(csrfIdx);
  });

  it("invalidates auth probe cache in OTP success block before CSRF sync", () => {
    const successBlock = otpVerifySuccessBlock(src);
    const invalidateIdx = successBlock.indexOf(
      "invalidateAuthUserProbeCache()"
    );
    const csrfIdx = successBlock.indexOf("setCsrfToken(result.data.csrfToken)");

    expect(invalidateIdx).toBeGreaterThan(-1);
    expect(csrfIdx).toBeGreaterThan(invalidateIdx);
  });

  it("resets passkey auto-start guard on OTP success before advancing step", () => {
    const successBlock = otpVerifySuccessBlock(src);
    const resetAutoIdx = successBlock.indexOf(
      "hasAutoStartedPasskeySignIn.current = false"
    );
    const stepIdx = successBlock.indexOf("setStep(result.data.nextStep)");

    expect(resetAutoIdx).toBeGreaterThan(-1);
    expect(stepIdx).toBeGreaterThan(resetAutoIdx);
  });

  it("guards duplicate OTP submits via shouldSkipOtpVerifySubmit and otpVerifySucceededRef", () => {
    expect(src).toContain("shouldSkipOtpVerifySubmit");
    expect(src).toContain("otpVerifySucceededRef");
    expect(src).toContain("otpVerifySucceededRef.current = true");
    expect(src).toContain("otpVerifySucceededRef.current = false");
  });

  it("keeps OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER aligned with handleCodeVerify success handlers", () => {
    const successBlock = otpVerifySuccessBlock(src);
    const orderedMarkers = OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER.map((step) => {
      switch (step) {
        case "setCsrfToken":
          return "setCsrfToken(result.data.csrfToken)";
        case "setUserId":
          return "setUserId(result.data.userId)";
        case "setPostOtpPasskeyPath":
          return 'result.data.nextStep === "passkey-signin"';
        case "setStep":
          return "setStep(result.data.nextStep)";
        default: {
          const _exhaustive: never = step;
          return _exhaustive;
        }
      }
    });

    let lastIndex = -1;
    for (const marker of orderedMarkers) {
      const index = successBlock.indexOf(marker);
      expect(index).toBeGreaterThan(-1);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
  });
});

describe("use-login-flow bootstrap wiring", () => {
  const src = readHookSource();

  it("runs bootstrap once per mount with strict-mode safe cleanup", () => {
    expect(src).toContain("initialBootstrapDoneRef");
    expect(src).toContain("if (initialBootstrapDoneRef.current)");
    expect(src).toContain("setCheckingAuth(false)");
    expect(src).toContain("bootstrapCompleted = true");
    expect(src).toContain("if (!bootstrapCompleted)");
    expect(src).not.toContain("authBootstrapKey");
  });

  it("routes bootstrap errors through login-flow-errors helpers", () => {
    expect(src).toContain("applyBootstrapError");
    expect(src).toContain("resolveBootstrapFriendlyError");
    expect(src).toContain("expectsExistingSessionOnBootstrap");
  });

  it("routes user-visible errors through shouldSurfaceLoginError", () => {
    expect(src).toContain("surfaceLoginError");
    expect(src).toContain("shouldSurfaceLoginError");
  });

  it("seeds trusted bootstrap userId via resolveTrustedBootstrapUserId", () => {
    expect(src).toContain("resolveTrustedBootstrapUserId");
  });
});

describe("use-login-flow OTP post-verify wiring", () => {
  const src = readHookSource();

  it("clears checkingAuth and sets otpVerifySucceeded on OTP success", () => {
    const successBlock = otpVerifySuccessBlock(src);
    expect(successBlock).toContain("setOtpVerifySucceeded(true)");
    expect(successBlock).toContain("setCheckingAuth(false)");
  });

  it("warns when device trust was not minted after OTP", () => {
    const successBlock = otpVerifySuccessBlock(src);
    expect(successBlock).toContain("!result.data.deviceTrustMinted");
    expect(successBlock).toContain("toast.warning");
    expect(successBlock).toContain("This device wasn't remembered");
  });
});

describe("use-login-flow passkey ceremony wiring", () => {
  const src = readHookSource();

  it("auto-starts passkey only on mobile", () => {
    expect(src).toContain("!isMobile");
    expect(src).toContain('runPasskeySignIn("auto")');
    expect(src).toContain('runPasskeySignIn("user")');
  });

  it("maps WebAuthn errors via mapPasskeyWebAuthnError", () => {
    expect(src).toContain("mapPasskeyWebAuthnError");
  });

  it("only resets hasAutoStarted after user-initiated WebAuthn cancel", () => {
    expect(src).toContain('if (ceremonySource === "user")');
    expect(src).toContain("hasAutoStartedPasskeySignIn.current = false");
    expect(src).toContain("webAuthnErrorName: errorName");
  });
});
