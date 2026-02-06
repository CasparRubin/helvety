"use client";

import { type ReactNode } from "react";

/**
 * Client-side providers wrapper.
 * E2EE is only used by helvety-tasks; this app does not need EncryptionProvider.
 */
interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root client providers for the app.
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
