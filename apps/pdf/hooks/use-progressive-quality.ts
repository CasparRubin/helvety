import * as React from "react";

import { QUALITY_UPGRADE } from "@/lib/constants";

/** Parameters for useProgressiveQuality: visibility, unmount flag, file type. */
interface UseProgressiveQualityParams {
  readonly isVisible: boolean;
  readonly shouldUnmount: boolean;
  readonly fileType: "pdf" | "image";
}

/** Return type of useProgressiveQuality: quality state, setter, and cleanup refs. */
interface UseProgressiveQualityReturn {
  readonly isHighQuality: boolean;
  readonly setIsHighQuality: React.Dispatch<React.SetStateAction<boolean>>;
  readonly qualityUpgradeTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  readonly qualityUpgradeIdleCallbackRef: React.MutableRefObject<number | null>;
}

/**
 * Custom hook for managing progressive quality loading of PDF thumbnails.
 *
 * Upgrades thumbnail quality after initial render and when element becomes visible.
 * Uses requestIdleCallback when available for better performance.
 *
 * @param params - Configuration object
 * @returns Object containing quality state and refs for cleanup
 */
export function useProgressiveQuality({
  isVisible,
  shouldUnmount,
  fileType,
}: UseProgressiveQualityParams): UseProgressiveQualityReturn {
  const [isHighQuality, setIsHighQuality] = React.useState(false);
  const qualityUpgradeTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const qualityUpgradeIdleCallbackRef = React.useRef<number | null>(null);

  /**
   * Cleans up pending quality upgrade timers and callbacks.
   */
  const cleanupQualityUpgrade = React.useCallback((): void => {
    if (qualityUpgradeTimeoutRef.current) {
      clearTimeout(qualityUpgradeTimeoutRef.current);
      qualityUpgradeTimeoutRef.current = null;
    }
    if (
      qualityUpgradeIdleCallbackRef.current !== null &&
      "cancelIdleCallback" in window &&
      typeof window.cancelIdleCallback === "function"
    ) {
      window.cancelIdleCallback(qualityUpgradeIdleCallbackRef.current);
      qualityUpgradeIdleCallbackRef.current = null;
    }
  }, []);

  /**
   * Upgrades quality and cleans up pending timers.
   */
  const upgradeQuality = React.useCallback((): void => {
    setIsHighQuality(true);
    cleanupQualityUpgrade();
  }, [cleanupQualityUpgrade]);

  /**
   * Schedules quality upgrade using requestIdleCallback with setTimeout fallback.
   */
  const scheduleQualityUpgrade = React.useCallback((): void => {
    if (
      "requestIdleCallback" in window &&
      typeof window.requestIdleCallback === "function"
    ) {
      // Use requestIdleCallback if available for better performance
      const idleCallbackId = window.requestIdleCallback(
        () => {
          upgradeQuality();
        },
        { timeout: QUALITY_UPGRADE.DELAY }
      );
      qualityUpgradeIdleCallbackRef.current = idleCallbackId;
      // Fallback timeout in case idle callback doesn't fire
      qualityUpgradeTimeoutRef.current = setTimeout(() => {
        cleanupQualityUpgrade();
        upgradeQuality();
      }, QUALITY_UPGRADE.DELAY);
    } else {
      // Fallback to setTimeout
      qualityUpgradeTimeoutRef.current = setTimeout(
        upgradeQuality,
        QUALITY_UPGRADE.DELAY
      );
    }
  }, [upgradeQuality, cleanupQualityUpgrade]);

  // Handle quality upgrade when element becomes visible
  React.useEffect(() => {
    if (isVisible && !shouldUnmount && !isHighQuality && fileType !== "image") {
      cleanupQualityUpgrade();
      scheduleQualityUpgrade();
    } else if (!isVisible || shouldUnmount) {
      cleanupQualityUpgrade();
      if (shouldUnmount) {
        setIsHighQuality(false);
      }
    }
  }, [
    isVisible,
    shouldUnmount,
    isHighQuality,
    fileType,
    scheduleQualityUpgrade,
    cleanupQualityUpgrade,
  ]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupQualityUpgrade();
    };
  }, [cleanupQualityUpgrade]);

  return {
    isHighQuality,
    setIsHighQuality,
    qualityUpgradeTimeoutRef,
    qualityUpgradeIdleCallbackRef,
  };
}
