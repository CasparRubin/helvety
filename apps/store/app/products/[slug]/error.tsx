"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the product detail page. */
export default function ProductError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load product" showBackButton />;
}
