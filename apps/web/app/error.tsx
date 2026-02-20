"use client";

import { AppError } from "@helvety/ui/app-error";

/** Root error boundary for the web gateway app. */
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} homeHref="/" />;
}
