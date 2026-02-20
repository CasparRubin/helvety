"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the space detail page. */
export default function SpaceError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load space" showBackButton />;
}
