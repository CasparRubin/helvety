"use client";

import { type ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { CSRFProvider } from "@/hooks/use-csrf";
import { EncryptionProvider } from "@/lib/crypto";

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
 * Client-side providers wrapper
 * Includes CSRFProvider, EncryptionProvider and any other client-only providers
 */
export function Providers({ children, csrfToken }: ProvidersProps) {
  return (
    <CSRFProvider csrfToken={csrfToken}>
      <TooltipProvider>
        <EncryptionProvider>{children}</EncryptionProvider>
      </TooltipProvider>
    </CSRFProvider>
  );
}
