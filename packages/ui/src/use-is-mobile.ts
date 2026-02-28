"use client";

import * as React from "react";

/** Shared mobile breakpoint in pixels. */
export const MOBILE_BREAKPOINT = 768;

/** Returns true when the current viewport is below the mobile breakpoint. */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/** React hook that tracks whether the current viewport is mobile-sized. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
