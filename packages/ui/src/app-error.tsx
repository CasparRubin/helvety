"use client";

import { logger } from "@helvety/shared/logger";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "./button";

/**
 *
 */
interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  homeHref?: string;
  /** Show "Go back" (router.back) instead of "Go home" link */
  showBackButton?: boolean;
}

/**
 *
 */
export function AppError({
  error,
  reset,
  title = "Something went wrong",
  homeHref,
  showBackButton = false,
}: AppErrorProps) {
  const router = useRouter();

  useEffect(() => {
    logger.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground max-w-md">
            An unexpected error occurred. Please try again, or contact us at{" "}
            <a
              href="mailto:contact@helvety.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              contact@helvety.com
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
          <Button onClick={reset} variant="default">
            <RefreshCw className="size-4" />
            Try again
          </Button>
          {showBackButton ? (
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
              Go back
            </Button>
          ) : homeHref ? (
            <Button variant="outline" asChild>
              <a href={homeHref}>Go home</a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
