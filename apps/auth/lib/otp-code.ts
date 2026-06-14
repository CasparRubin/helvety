/**
 * User-facing OTP lifetime copy in login UI and email templates ("1 hour").
 * Must match Supabase Auth email OTP expiry (Dashboard → Authentication → Email).
 */
export const OTP_USER_VISIBLE_EXPIRY_LABEL = "1 hour" as const;

/**
 * Email OTP length. Must match Supabase Auth email OTP length
 * (Dashboard → Authentication → Email → Email OTP length).
 */
export const OTP_CODE_LENGTH = 8;

/**
 * User-facing OTP length copy in login UI (e.g. "8 digits").
 * Keep legal/privacy copy aligned via `otp-code-guardrail.test.ts`.
 */
export const OTP_USER_VISIBLE_LENGTH_LABEL =
  `${OTP_CODE_LENGTH} digits` as const;

/** Same pattern as `verifyEmailCode` in `otp-actions.ts`. */
export const OTP_CODE_REGEX = new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`);

/** True when the OTP field matches a complete code of {@link OTP_CODE_LENGTH} digits. */
export function isOtpCodeComplete(code: string): boolean {
  return OTP_CODE_REGEX.test(code);
}
