"use client";

import { urls } from "@helvety/shared/config";
import { AppError } from "@helvety/ui/app-error";

/** Root error boundary for the auth app. */
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} homeHref={urls.home} />;
}
