"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { fetchCSRFToken } from "@/app/actions/csrf-actions";

/**
 * CSRF Token Context
 *
 * Provides CSRF token to client components for use with Server Actions.
 * The token is fetched via a Server Action (which can set cookies).
 */

/** CSRF token context value. */
interface CSRFContextValue {
  token: string | null;
}

const CSRFContext = createContext<CSRFContextValue | null>(null);

/** Props for CSRFProvider (children). */
interface CSRFProviderProps {
  children: ReactNode;
}

/**
 * Provider component for CSRF token.
 * Fetches the CSRF token via a Server Action on mount.
 *
 * Usage:
 * ```tsx
 * <CSRFProvider>
 *   <YourClientComponent />
 * </CSRFProvider>
 * ```
 */
export function CSRFProvider({ children }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    void fetchCSRFToken().then(setToken);
  }, []);

  return (
    <CSRFContext.Provider value={{ token }}>{children}</CSRFContext.Provider>
  );
}

/**
 * Hook to access the CSRF token in client components.
 *
 * @returns The CSRF token or null if not yet loaded
 * @throws Error if used outside of CSRFProvider
 */
export function useCSRFToken(): string | null {
  const context = useContext(CSRFContext);
  if (context === null) {
    throw new Error("useCSRFToken must be used within a CSRFProvider");
  }
  return context.token;
}
