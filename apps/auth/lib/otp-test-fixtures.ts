import { OTP_CODE_LENGTH } from "@/lib/otp-code";

/** Valid numeric OTP for tests; length tracks `OTP_CODE_LENGTH` / Supabase config. */
export const VALID_OTP_CODE = "0".repeat(OTP_CODE_LENGTH);

/** One digit short of a complete OTP. */
export const OTP_CODE_TOO_SHORT = "0".repeat(OTP_CODE_LENGTH - 1);

/** One digit longer than a complete OTP. */
export const OTP_CODE_TOO_LONG = "0".repeat(OTP_CODE_LENGTH + 1);
