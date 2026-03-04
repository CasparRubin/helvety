"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Guards client-side navigation so stale async callbacks from a previous
 * route instance cannot redirect after the user has moved elsewhere.
 */
export function useRouteInstanceGuard() {
  const pathname = usePathname();
  const originPathRef = useRef(pathname);
  const currentPathRef = useRef(pathname);
  const mountedRef = useRef(true);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canNavigate = useCallback(() => {
    return (
      mountedRef.current && currentPathRef.current === originPathRef.current
    );
  }, []);

  return { canNavigate };
}
