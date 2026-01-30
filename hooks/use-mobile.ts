import * as React from "react"

/**
 * Mobile breakpoint in pixels (matches SCREEN_BREAKPOINTS.MOBILE from constants)
 */
export const MOBILE_BREAKPOINT = 768

/**
 * Synchronously checks if the current window width indicates a mobile device.
 * Can be used outside of React components.
 * 
 * @returns True if window width is below mobile breakpoint
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * React hook to detect if the current device is mobile.
 * 
 * Uses SSR-safe initialization: defaults to false on server and during
 * initial client render, then updates to the actual value in useEffect.
 * 
 * @returns True if device is mobile (width < 768px), false during SSR
 */
export function useIsMobile(): boolean {
  // Initialize with false for SSR safety - will be updated in useEffect
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Set initial value immediately
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
