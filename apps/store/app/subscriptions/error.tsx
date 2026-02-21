"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the subscriptions page. */
export default function SubscriptionsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppError {...props} title="Failed to load subscriptions" showBackButton />
  );
}
