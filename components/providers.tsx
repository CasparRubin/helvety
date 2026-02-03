"use client";

import { type ReactNode } from "react";

import { EncryptionProvider } from "@/lib/crypto";

/**
 * Client-side providers wrapper.
 * Includes EncryptionProvider so the navbar and other components can use useEncryptionContext().
 */
interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root client providers (EncryptionProvider) for the app.
 */
export function Providers({ children }: ProvidersProps) {
  return <EncryptionProvider>{children}</EncryptionProvider>;
}
