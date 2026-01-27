/**
 * Custom hook for virtual scrolling optimization.
 * Only renders pages that are visible or near the viewport.
 */

import * as React from "react"

/**
 * Configuration for virtual scrolling.
 */
interface VirtualScrollingConfig {
  /** Number of items to render before the visible area */
  overscan?: number
  /** Estimated height of each item in pixels */
  itemHeight?: number
  /** Container element ref */
  containerRef?: React.RefObject<HTMLElement>
}

/**
 * Return type for useVirtualScrolling hook.
 */
interface UseVirtualScrollingReturn {
  /** Indices of items that should be rendered */
  visibleIndices: ReadonlySet<number>
  /** Total number of items */
  totalItems: number
  /** Whether virtual scrolling is enabled */
  enabled: boolean
}

/**
 * Custom hook for virtual scrolling.
 * Determines which items should be rendered based on viewport visibility.
 * 
 * @param totalItems - Total number of items
 * @param config - Virtual scrolling configuration
 * @returns Virtual scrolling state and visible indices
 */
export function useVirtualScrolling(
  totalItems: number,
  config: VirtualScrollingConfig = {}
): UseVirtualScrollingReturn {
  const { overscan = 3, itemHeight, containerRef } = config
  const [visibleIndices, setVisibleIndices] = React.useState<Set<number>>(new Set())
  const [enabled, setEnabled] = React.useState(true)

  // Disable virtual scrolling for small lists (not worth the overhead)
  React.useEffect(() => {
    setEnabled(totalItems > 20) // Only enable for 20+ items
  }, [totalItems])

  // Calculate visible range based on scroll position
  React.useEffect(() => {
    if (!enabled || !containerRef?.current) {
      // Render all items if virtual scrolling is disabled
      const allIndices = new Set(Array.from({ length: totalItems }, (_, i) => i))
      setVisibleIndices(allIndices)
      return
    }

    const container = containerRef.current
    const updateVisibleIndices = () => {
      const scrollTop = container.scrollTop || window.scrollY
      const viewportHeight = window.innerHeight
      
      // Calculate visible range
      // For now, we'll use a simpler approach: render items within viewport + overscan
      // A more sophisticated implementation would calculate based on item positions
      const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight || 400)) - overscan)
      const endIndex = Math.min(
        totalItems - 1,
        Math.ceil((scrollTop + viewportHeight) / (itemHeight || 400)) + overscan
      )

      const newVisibleIndices = new Set<number>()
      for (let i = startIndex; i <= endIndex; i++) {
        newVisibleIndices.add(i)
      }

      setVisibleIndices(newVisibleIndices)
    }

    // Initial calculation
    updateVisibleIndices()

    // Update on scroll (throttled)
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateVisibleIndices()
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Also listen for resize
    window.addEventListener('resize', updateVisibleIndices, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateVisibleIndices)
    }
  }, [enabled, totalItems, overscan, itemHeight, containerRef])

  // If virtual scrolling is disabled, render all items
  React.useEffect(() => {
    if (!enabled) {
      const allIndices = new Set(Array.from({ length: totalItems }, (_, i) => i))
      setVisibleIndices(allIndices)
    }
  }, [enabled, totalItems])

  return {
    visibleIndices,
    totalItems,
    enabled,
  }
}

