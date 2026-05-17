import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AuthStepper,
  getAuthStepperStepCount,
  type AuthStep,
  type AuthStepperMode,
} from "./auth-stepper";

/** Renders `AuthStepper` to static HTML for markup assertions. */
function renderAuthStepper(props: {
  mode: AuthStepperMode;
  currentStep: AuthStep;
}): string {
  return renderToStaticMarkup(<AuthStepper {...props} />);
}

describe("auth-stepper", () => {
  describe("getAuthStepperStepCount", () => {
    it.each([
      ["four_before_otp", 4],
      ["four_full", 4],
      ["three_skip_setup", 3],
    ] as const)("returns %i for %s", (mode, count) => {
      expect(getAuthStepperStepCount(mode)).toBe(count);
    });
  });

  describe("AuthStepper", () => {
    it("uses opaque card backdrop for readable progress circles", () => {
      const html = renderAuthStepper({
        mode: "four_before_otp",
        currentStep: "email",
      });

      expect(html).toContain('data-testid="auth-stepper-backdrop"');
      expect(html).toContain("bg-card ring-border/60");
      expect(html).not.toContain("backdrop-blur-sm");
      expect(html).not.toContain("bg-card/55");
      expect(html).not.toContain("bg-card/75");
      expect(html).not.toContain("supports-[backdrop-filter]:bg-card/55");
    });

    it("does not use pre-contrast low-visibility styles", () => {
      const html = renderAuthStepper({
        mode: "four_before_otp",
        currentStep: "email",
      });

      expect(html).not.toContain("bg-primary/20");
      expect(html).not.toContain("h-0.5");
    });

    it("highlights the current step with opaque card and primary border", () => {
      const html = renderAuthStepper({
        mode: "four_before_otp",
        currentStep: "email",
      });

      expect(html).toContain("border-primary");
      expect(html).toContain(
        "bg-card text-primary border-primary ring-card border-2"
      );
    });

    it("renders three steps without passkey setup in three_skip_setup", () => {
      const html = renderAuthStepper({
        mode: "three_skip_setup",
        currentStep: "sign_in",
      });

      expect(html).toContain("Passkey Sign-in");
      expect(html).not.toContain("Passkey Setup");
      expect(html.match(/rounded-full/g)?.length).toBe(3);
    });

    it("marks completed steps with primary fill and check icon", () => {
      const html = renderAuthStepper({
        mode: "four_before_otp",
        currentStep: "verify_code",
      });

      expect(html).toContain(
        "bg-primary text-primary-foreground ring-card shadow-sm ring-2"
      );
      expect(html).toContain("<svg");
      expect(html).toContain("Email");
    });

    it("uses border-colored inactive connectors", () => {
      const html = renderAuthStepper({
        mode: "four_before_otp",
        currentStep: "email",
      });

      expect(html).toContain("bg-border");
      expect(html).not.toMatch(/w-\[calc\(50%-24px\)\] bg-muted/);
    });
  });
});
