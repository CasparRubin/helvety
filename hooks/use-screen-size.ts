import * as React from "react";

import { SCREEN_BREAKPOINTS } from "@/lib/constants";

/**
 * Screen size category
 */
export type ScreenSize = "mobile" | "tablet" | "desktop";

interface UseScreenSizeReturn {
  readonly screenSize: ScreenSize;
  readonly width: number;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

/**
 * Custom hook to detect screen size category and provide responsive utilities.
 *
 * @returns Object containing screen size category, width, and utility functions
 */
export function useScreenSize(): UseScreenSizeReturn {
  const [screenSize, setScreenSize] = React.useState<ScreenSize>("desktop");
  const [width, setWidth] = React.useState<number>(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScreenSize = (): void => {
      const w = window.innerWidth;
      setWidth(w);

      if (w < SCREEN_BREAKPOINTS.MOBILE) {
        setScreenSize("mobile");
      } else if (w < SCREEN_BREAKPOINTS.TABLET) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    // Initial update
    updateScreenSize();

    // Listen for resize events
    window.addEventListener("resize", updateScreenSize);

    // Use ResizeObserver if available for more accurate updates
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScreenSize();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return {
    screenSize,
    width,
    isMobile: screenSize === "mobile",
    isTablet: screenSize === "tablet",
    isDesktop: screenSize === "desktop",
  };
}
