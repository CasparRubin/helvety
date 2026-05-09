"use client";

import { CONTACT_EMAIL, urls } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
import { useEffect } from "react";

/** Props for `RootGlobalError`. */
export type RootGlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Defaults to marketing home (`urls.home`) for “Go home”. */
  homeUrl?: string;
};

/**
 * Root layout error boundary - catches errors that occur in the root layout itself.
 *
 * Kept intentionally minimal (no heavy UI imports) so it remains functional when
 * the root layout or its dependencies are the source of the error.
 */
export function RootGlobalError({
  error,
  reset,
  homeUrl = urls.home,
}: RootGlobalErrorProps) {
  useEffect(() => {
    logger.logUnexpectedError("Root layout error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {GENERIC_USER_ERROR}
              </h1>
              <p className="text-muted-foreground max-w-md">
                Please try again, or contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                if the problem persists.
              </p>
              {error.digest ? (
                <p className="text-muted-foreground/70 text-xs">
                  Error ID: {error.digest}
                </p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
              >
                Try again
              </button>
              <a
                href={homeUrl}
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
