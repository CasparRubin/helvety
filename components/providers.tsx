"use client";

import { type ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { EncryptionProvider } from "@/lib/crypto";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * Includes EncryptionProvider and any other client-only providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider>
      <EncryptionProvider>{children}</EncryptionProvider>
    </TooltipProvider>
  );
}
