"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the unit detail page. */
export default function UnitError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load unit" showBackButton />;
}
