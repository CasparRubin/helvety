import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER } from "./use-login-flow";

const hookPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "use-login-flow.ts"
);

describe("use-login-flow OTP verify wiring", () => {
  const src = readFileSync(hookPath, "utf8");

  it("imports useSetCSRFToken and syncs rotated token before advancing step", () => {
    expect(src).toContain("useSetCSRFToken");
    expect(src).toContain("setCsrfToken(result.data.csrfToken)");

    const csrfIdx = src.indexOf("setCsrfToken(result.data.csrfToken)");
    const stepIdx = src.indexOf("setStep(result.data.nextStep)");

    expect(csrfIdx).toBeGreaterThan(-1);
    expect(stepIdx).toBeGreaterThan(csrfIdx);
  });

  it("guards duplicate OTP submits via shouldSkipOtpVerifySubmit and otpVerifySucceededRef", () => {
    expect(src).toContain("shouldSkipOtpVerifySubmit");
    expect(src).toContain("otpVerifySucceededRef");
    expect(src).toContain("otpVerifySucceededRef.current = true");
    expect(src).toContain("otpVerifySucceededRef.current = false");
  });

  it("keeps OTP_VERIFY_SUCCESS_CLIENT_SYNC_ORDER aligned with handleCodeVerify success handlers", () => {
    const successBlockStart = src.indexOf("if (result.data) {");
    const successBlockEnd = src.indexOf("} catch (err)", successBlockStart);
    expect(successBlockStart).toBeGreaterThan(-1);
    expect(successBlockEnd).toBeGreaterThan(successBlockStart);

    const successBlock = src.slice(successBlockStart, successBlockEnd);
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
