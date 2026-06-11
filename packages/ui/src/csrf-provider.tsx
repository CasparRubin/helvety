"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * CSRF Token Context
 *
 * Provides CSRF token to client components for use with Server Actions.
 * The initial token is read server-side via `getCachedCSRFToken` (validated
 * cookie, or the proxy bootstrap header on the same request) and passed as a
 * prop. The provider does not fetch or mint tokens on its own.
 *
 * After auth state changes rotate the CSRF cookie server-side (for example OTP
 * verify in `apps/auth`), apply the rotated token returned by the server action
 * via `useSetCSRFToken` so the next mutating action matches the cookie before
 * the layout re-renders. The prop also resyncs when a future RSC pass supplies
 * a new layout token.
 */

/** CSRF token context value. */
interface CSRFContextValue {
  token: string;
  setToken: (token: string) => void;
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
  const [token, setToken] = useState(csrfToken);

  useEffect(() => {
    setToken(csrfToken);
  }, [csrfToken]);

  const value = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token]
  );

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
 * Updates the client-held CSRF token after server-side rotation (e.g. post-OTP).
 *
 * @throws Error if used outside of CSRFProvider
 */
export function useSetCSRFToken(): (token: string) => void {
  const context = useContext(CSRFContext);
  if (context === null) {
    throw new Error("useSetCSRFToken must be used within a CSRFProvider");
  }
  return context.setToken;
}

/**
 * Safe token accessor for components that can render without provider context.
 */
export function useCSRFSafe(): string | null {
  const context = useContext(CSRFContext);
  return context?.token ?? null;
}
