import { describe, expect, it } from "vitest";

import {
  authFlowTypeToStepperMode,
  type AuthStepperMode,
} from "./encryption-stepper";

describe("encryption-stepper", () => {
  it("authFlowTypeToStepperMode maps legacy flow types", () => {
    expect(authFlowTypeToStepperMode("new_user")).toBe("four_full");
    expect(authFlowTypeToStepperMode("returning_user")).toBe(
      "three_skip_setup"
    );
  });

  it("defines three distinct stepper modes", () => {
    const modes: AuthStepperMode[] = [
      "four_before_otp",
      "four_full",
      "three_skip_setup",
    ];
    expect(new Set(modes).size).toBe(3);
  });
});
