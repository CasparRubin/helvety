import { logger } from "../logger";

let cookieWriteSkipCount = 0;

/** Input payload for cookie-write failure handling. */
type CookieWriteFailureInput = {
  error: unknown;
  cookieCount: number;
  context: string;
};

/** Handles cookie write failures with dev-fail and production telemetry. */
export function handleSupabaseCookieWriteFailure({
  error,
  cookieCount,
  context,
}: CookieWriteFailureInput): void {
  cookieWriteSkipCount += 1;
  const errorMessage =
    "Supabase cookie write skipped in createServerComponentClient. Persisting refreshed tokens requires the shared proxy (or a Server Action / Route Handler), not RSC.";
  const metadata = {
    event: "supabase_cookie_write_skipped",
    skipCount: cookieWriteSkipCount,
    cookieCount,
    context,
    errorName: error instanceof Error ? error.name : "unknown",
  };

  if (process.env.NODE_ENV === "development") {
    throw new Error(errorMessage, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  logger.warn(errorMessage, metadata);
}
