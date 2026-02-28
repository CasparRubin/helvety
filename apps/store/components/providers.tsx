"use client";

import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { type ReactNode } from "react";

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  /** Child components */
  children: ReactNode;
  /** CSRF token for security */
  csrfToken: string;
}

/**
 * Client-side providers wrapper.
 * Includes CSRFProvider and any other client-only providers.
 */
export function Providers({ children, csrfToken }: ProvidersProps) {
  return <CSRFProvider csrfToken={csrfToken}>{children}</CSRFProvider>;
}
