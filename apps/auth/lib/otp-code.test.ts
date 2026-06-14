import { describe, expect, it } from "vitest";

import { isOtpCodeComplete, OTP_CODE_LENGTH, OTP_CODE_REGEX } from "./otp-code";
import {
  OTP_CODE_TOO_LONG,
  OTP_CODE_TOO_SHORT,
  VALID_OTP_CODE,
} from "./otp-test-fixtures";

describe("otp-code", () => {
  it("matches exactly OTP_CODE_LENGTH digits", () => {
    expect(OTP_CODE_REGEX.test(VALID_OTP_CODE)).toBe(true);
    expect(VALID_OTP_CODE).toHaveLength(OTP_CODE_LENGTH);
    expect(OTP_CODE_REGEX.test(OTP_CODE_TOO_SHORT)).toBe(false);
    expect(OTP_CODE_REGEX.test(OTP_CODE_TOO_LONG)).toBe(false);
    expect(OTP_CODE_REGEX.test("12345a")).toBe(false);
    expect(OTP_CODE_REGEX.test("")).toBe(false);
  });

  it("isOtpCodeComplete mirrors the regex", () => {
    expect(isOtpCodeComplete(VALID_OTP_CODE)).toBe(true);
    expect(isOtpCodeComplete(OTP_CODE_TOO_SHORT)).toBe(false);
    expect(isOtpCodeComplete("12")).toBe(false);
  });
});
