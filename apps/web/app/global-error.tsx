"use client";

import { CONTACT_EMAIL } from "@helvety/shared/config";
import { useEffect } from "react";

/**
 * Root layout error boundary — catches errors that occur in the root layout itself.
 *
 * Kept intentionally minimal (no shared UI imports) so it remains functional
 * even when the root layout or its dependencies are the source of the error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-muted-foreground max-w-md">
                A critical error occurred. Please try again, or contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                if the problem persists.
              </p>
              {error.digest && (
                <p className="text-muted-foreground/70 text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- intentionally minimal: no shared imports so this boundary works even when root layout fails */}
              <a
                href="/"
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
