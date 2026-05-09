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
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => isMobileDevice(),
    () => false
  );
}
