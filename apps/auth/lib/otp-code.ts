/**
 * User-facing OTP lifetime copy in login UI and email templates ("1 hour").
 * Must match Supabase Auth email OTP expiry (Dashboard → Authentication → Email).
 */
export const OTP_USER_VISIBLE_EXPIRY_LABEL = "1 hour" as const;

/** Lower bound for email OTP length (matches Supabase / server validation). */
const OTP_CODE_MIN_LENGTH = 6;
/** Upper bound for email OTP length. */
export const OTP_CODE_MAX_LENGTH = 8;

/** Same pattern as `verifyEmailCode` in `otp-actions.ts`. */
export const OTP_CODE_REGEX = new RegExp(
  `^\\d{${OTP_CODE_MIN_LENGTH},${OTP_CODE_MAX_LENGTH}}$`
);

/** True when the OTP field matches a complete 6–8 digit code. */
export function isOtpCodeComplete(code: string): boolean {
  return OTP_CODE_REGEX.test(code);
}
