"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * Guards client-side navigation so stale async callbacks from a previous
 * route instance cannot redirect after the user has moved elsewhere.
 */
export function useRouteInstanceGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const originPathRef = useRef(routeKey);
  const currentPathRef = useRef(routeKey);
  const mountedRef = useRef(true);

  useEffect(() => {
    currentPathRef.current = routeKey;
  }, [routeKey]);

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
