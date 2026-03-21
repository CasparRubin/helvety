import { describe, expect, it } from "vitest";

import { isOtpCodeComplete, OTP_CODE_REGEX } from "./otp-code";

describe("otp-code", () => {
  it("matches 6–8 digit codes only", () => {
    expect(OTP_CODE_REGEX.test("123456")).toBe(true);
    expect(OTP_CODE_REGEX.test("1234567")).toBe(true);
    expect(OTP_CODE_REGEX.test("12345678")).toBe(true);
    expect(OTP_CODE_REGEX.test("12345")).toBe(false);
    expect(OTP_CODE_REGEX.test("123456789")).toBe(false);
    expect(OTP_CODE_REGEX.test("12345a")).toBe(false);
    expect(OTP_CODE_REGEX.test("")).toBe(false);
  });

  it("isOtpCodeComplete mirrors the regex", () => {
    expect(isOtpCodeComplete("12345678")).toBe(true);
    expect(isOtpCodeComplete("12")).toBe(false);
  });
});
