"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * CSRF Token Context
 *
 * Provides CSRF token to client components for use with Server Actions.
 * The token is read server-side via `getCachedCSRFToken` (validated cookie, or
 * the proxy bootstrap header on the same request) and passed as a prop — no
 * client-side fetch or regeneration.
 */

/** CSRF token context value. */
interface CSRFContextValue {
  token: string;
}

const CSRFContext = createContext<CSRFContextValue | null>(null);

/** Props for CSRFProvider. */
interface CSRFProviderProps {
  csrfToken: string;
  children: ReactNode;
}

/**
 * Provider component for CSRF token.
 * Token is read server-side and passed as a prop (matches auth/store pattern).
 *
 * Usage:
 * ```tsx
 * <CSRFProvider csrfToken={csrfToken}>
 *   <YourClientComponent />
 * </CSRFProvider>
 * ```
 */
export function CSRFProvider({ csrfToken, children }: CSRFProviderProps) {
  const value = useMemo(() => ({ token: csrfToken }), [csrfToken]);

  return <CSRFContext.Provider value={value}>{children}</CSRFContext.Provider>;
}

/**
 * Hook to access the CSRF token in client components.
 *
 * @returns The CSRF token
 * @throws Error if used outside of CSRFProvider
 */
export function useCSRFToken(): string {
  const context = useContext(CSRFContext);
  if (context === null) {
    throw new Error("useCSRFToken must be used within a CSRFProvider");
  }
  return context.token;
}

/**
 * Safe token accessor for components that can render without provider context.
 */
export function useCSRFSafe(): string | null {
  const context = useContext(CSRFContext);
  return context?.token ?? null;
}
