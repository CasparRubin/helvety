"use client";

import * as React from "react";

import { SCREEN_BREAKPOINTS } from "@/lib/constants";

/**
 * Screen size category
 */
type ScreenSize = "mobile" | "tablet" | "desktop";

/** Return type of useScreenSize: screenSize, width, and isMobile/isTablet/isDesktop. */
interface UseScreenSizeReturn {
  readonly screenSize: ScreenSize;
  readonly width: number;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

/** Shared viewport snapshot used by every thumbnail in the grid. */
interface ScreenSizeSnapshot {
  readonly screenSize: ScreenSize;
  readonly width: number;
}

const SERVER_SNAPSHOT: ScreenSizeSnapshot = {
  screenSize: "desktop",
  width: 0,
};

let snapshot: ScreenSizeSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let teardown: (() => void) | null = null;

/** Reads the current viewport, returning a stable object while it is unchanged. */
function readSnapshot(): ScreenSizeSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  const width = window.innerWidth;
  const screenSize: ScreenSize =
    width < SCREEN_BREAKPOINTS.MOBILE
      ? "mobile"
      : width < SCREEN_BREAKPOINTS.TABLET
        ? "tablet"
        : "desktop";

  if (snapshot.width === width && snapshot.screenSize === screenSize) {
    return snapshot;
  }

  snapshot = { width, screenSize };
  return snapshot;
}

/** Single shared resize listener (stable identity for `useSyncExternalStore`). */
function subscribeToScreenSize(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  if (!teardown) {
    const handleResize = (): void => {
      readSnapshot();
      for (const listener of listeners) {
        listener();
      }
    };
    window.addEventListener("resize", handleResize);
    teardown = () => {
      window.removeEventListener("resize", handleResize);
    };
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      teardown?.();
      teardown = null;
    }
  };
}

/**
 * Custom hook to detect screen size category and provide responsive utilities.
 *
 * A single module-level subscription is shared by all consumers so grids with
 * hundreds of thumbnails do not register hundreds of resize listeners.
 *
 * @returns Object containing screen size category, width, and boolean flags (isMobile, isTablet, isDesktop)
 */
export function useScreenSize(): UseScreenSizeReturn {
  const { screenSize, width } = React.useSyncExternalStore(
    subscribeToScreenSize,
    readSnapshot,
    () => SERVER_SNAPSHOT
  );

  return {
    screenSize,
    width,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
  };
}
