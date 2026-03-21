import { describe, expect, it } from "vitest";

import {
  getAuthStepperStepCount,
  type AuthStepperMode,
} from "./encryption-stepper";

describe("encryption-stepper", () => {
  it("reports step counts per mode", () => {
    const modes: AuthStepperMode[] = [
      "four_before_otp",
      "four_full",
      "three_skip_setup",
    ];
    expect(modes.map((m) => getAuthStepperStepCount(m))).toEqual([4, 4, 3]);
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
