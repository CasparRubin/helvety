"use client";

import { AppError } from "@helvety/ui/app-error";

/** Error boundary for the tenants page. */
export default function TenantsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppError {...props} title="Failed to load tenants" showBackButton />;
}
