import * as React from "react"
import { DELAYS, CRITICAL_ERROR_PATTERNS } from "@/lib/constants"

interface UseErrorHandlerReturn {
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
  dismissError: () => void
}

/**
 * Custom hook for managing error state with auto-dismiss functionality.
 * Non-critical errors are automatically dismissed after a delay.
 * 
 * @param isProcessing - Whether a processing operation is in progress
 * @returns Object containing error state, setter, and dismiss function
 */
export function useErrorHandler(isProcessing: boolean): UseErrorHandlerReturn {
  const [error, setError] = React.useState<string | null>(null)
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissError = React.useCallback((): void => {
    setError(null)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }
  }, [])

  /**
   * Auto-dismisses non-critical errors after a delay.
   * Critical errors (file loading/processing failures) remain visible until manually dismissed.
   */
  React.useEffect(() => {
    if (error && !isProcessing) {
      // Check if error matches any critical error pattern
      const isCriticalError = CRITICAL_ERROR_PATTERNS.some(pattern => error.includes(pattern))
      
      if (!isCriticalError) {
        errorTimeoutRef.current = setTimeout(() => {
          setError(null)
        }, DELAYS.ERROR_AUTO_DISMISS)
      }

      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
      }
    }
  }, [error, isProcessing])

  return {
    error,
    setError,
    dismissError,
  }
}

