import { describe, expect, it } from "vitest";

import {
  resolveLoginCurrentAuthStep,
  resolveLoginStepperMode,
  type LoginStep,
} from "./login-flow-stepper";

describe("login-flow-stepper", () => {
  describe("resolveLoginCurrentAuthStep", () => {
    it("maps each login step to the auth stepper id", () => {
      const cases: { step: LoginStep; auth: string }[] = [
        { step: "email", auth: "email" },
        { step: "verify-code", auth: "verify_code" },
        { step: "passkey-signin", auth: "sign_in" },
        { step: "encryption-setup", auth: "create_passkey" },
      ];
      for (const { step, auth } of cases) {
        expect(resolveLoginCurrentAuthStep(step)).toBe(auth);
      }
    });
  });

  describe("resolveLoginStepperMode", () => {
    it("uses four_before_otp on email and verify-code", () => {
      expect(resolveLoginStepperMode("email", null)).toBe("four_before_otp");
      expect(resolveLoginStepperMode("verify-code", null)).toBe(
        "four_before_otp"
      );
    });

    it("uses four_full on encryption-setup", () => {
      expect(
        resolveLoginStepperMode("encryption-setup", "setup_then_signin")
      ).toBe("four_full");
      expect(resolveLoginStepperMode("encryption-setup", null)).toBe(
        "four_full"
      );
    });

    it("uses three_skip_setup on passkey-signin unless coming from setup", () => {
      expect(resolveLoginStepperMode("passkey-signin", null)).toBe(
        "three_skip_setup"
      );
      expect(resolveLoginStepperMode("passkey-signin", "direct_signin")).toBe(
        "three_skip_setup"
      );
    });

    it("uses four_full on passkey-signin after registration handoff", () => {
      expect(
        resolveLoginStepperMode("passkey-signin", "setup_then_signin")
      ).toBe("four_full");
    });
  });
});
