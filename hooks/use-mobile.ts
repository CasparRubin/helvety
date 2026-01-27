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
 * @returns True if device is mobile (width < 768px)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
