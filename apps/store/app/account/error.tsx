"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the account page. */
export default function AccountError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load account" showBackButton />;
}
