"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the item detail page. */
export default function ItemError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load item" showBackButton />;
}
