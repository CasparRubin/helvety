/**
 * Canonical user-visible error copy shared across server actions, API routes,
 * and client fallbacks. Import from `@helvety/shared/user-facing-errors` (no
 * `server-only`) so client components can reuse the same strings.
 */

/** Default seconds when a rate-limit response omits `retryAfter`. */
const DEFAULT_RATE_LIMIT_RETRY_SECONDS = 60;

/** Single generic line for unknown failures (actions, APIs, toasts, titles). */
export const GENERIC_USER_ERROR = "Something went wrong" as const;

/**
 * User-facing message when a rate limit is exceeded.
 *
 * @param retryAfter - Seconds until retry is sensible; defaults to 60 when missing.
 * @param kind - `download` keeps an explicit “download” qualifier for public URLs.
 */
export function buildRateLimitedUserMessage(
  retryAfter?: number,
  kind: "default" | "download" = "default"
): string {
  const seconds = retryAfter ?? DEFAULT_RATE_LIMIT_RETRY_SECONDS;
  if (kind === "download") {
    return `Too many download requests. Wait ${seconds} seconds, then try again.`;
  }
  return `Too many requests. Wait ${seconds} seconds, then try again.`;
}
