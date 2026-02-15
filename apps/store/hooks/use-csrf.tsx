"use client";

/**
 * CSRF Token Context and Hook
 *
 * Provides CSRF tokens to client components for use in server actions.
 * Token is generated server-side and passed to the provider.
 */

import * as React from "react";

/** Internal context value containing the CSRF token */
interface CSRFContextValue {
  /** The current CSRF token */
  csrfToken: string;
}

const CSRFContext = React.createContext<CSRFContextValue | null>(null);

/**
 * Provider component for CSRF tokens.
 * Wrap your app or protected sections with this provider.
 *
 * @param props.csrfToken - The CSRF token generated server-side
 * @param props.children - Child components
 */
export function CSRFProvider({
  csrfToken,
  children,
}: {
  csrfToken: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ csrfToken }), [csrfToken]);

  return <CSRFContext.Provider value={value}>{children}</CSRFContext.Provider>;
}

/**
 * Hook to access the CSRF token.
 *
 * @returns The current CSRF token
 * @throws Error if used outside of CSRFProvider
 */
export function useCSRF(): string {
  const context = React.useContext(CSRFContext);

  if (!context) {
    throw new Error("useCSRF must be used within a CSRFProvider");
  }

  return context.csrfToken;
}

/**
 * Hook to safely access the CSRF token (returns null if not available).
 * Use this for components that may render outside a CSRFProvider context.
 *
 * @returns The current CSRF token or null
 */
export function useCSRFSafe(): string | null {
  const context = React.useContext(CSRFContext);
  return context?.csrfToken ?? null;
}
