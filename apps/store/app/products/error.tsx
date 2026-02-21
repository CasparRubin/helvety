"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the products catalog page. */
export default function ProductsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load products" showBackButton />;
}
