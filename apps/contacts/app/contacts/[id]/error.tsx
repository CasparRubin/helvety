"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the contact detail page. */
export default function ContactError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load contact" showBackButton />;
}
