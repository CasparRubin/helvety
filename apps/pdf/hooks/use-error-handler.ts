import * as React from "react";
import { toast } from "sonner";

import { TOAST_DURATIONS, CRITICAL_ERROR_PATTERNS } from "@/lib/constants";

/** Return type of useErrorHandler: setError and dismissError. */
interface UseErrorHandlerReturn {
  readonly setError: (error: string | null) => void;
  readonly dismissError: () => void;
}

/**
 * Custom hook for managing error display via toast notifications.
 * Non-critical errors are automatically dismissed after a delay.
 * Critical errors persist until manually dismissed.
 *
 * @param _isProcessing - Whether a processing operation is in progress (kept for API compatibility)
 * @returns Object containing setError and dismissError functions
 */
export function useErrorHandler(_isProcessing: boolean): UseErrorHandlerReturn {
  const toastIdRef = React.useRef<string | number | null>(null);

  const setError = React.useCallback((error: string | null): void => {
    // Dismiss previous toast if setting a new error or clearing
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    // If null, just clear (already dismissed above)
    if (error === null) {
      return;
    }

    // Check if error matches any critical error pattern
    const isCriticalError = CRITICAL_ERROR_PATTERNS.some((pattern: string) =>
      error.includes(pattern)
    );

    // Show toast with appropriate duration
    // Critical errors: Infinity (persist until dismissed)
    // Non-critical errors: auto-dismiss after configured delay
    const toastId = toast.error(error, {
      duration: isCriticalError
        ? TOAST_DURATIONS.ERROR_CRITICAL
        : TOAST_DURATIONS.ERROR,
    });

    toastIdRef.current = toastId;
  }, []);

  const dismissError = React.useCallback((): void => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return (): void => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  return {
    setError,
    dismissError,
  };
}
