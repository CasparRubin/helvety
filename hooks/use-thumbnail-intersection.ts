/**
 * Custom hook for managing thumbnail visibility using Intersection Observer.
 * Handles lazy loading and memory management by unmounting thumbnails far off-screen.
 */

import * as React from "react"
import { INTERSECTION_OBSERVER, PDF_RENDER } from "@/lib/constants"

/**
 * Return type for useThumbnailIntersection hook.
 */
export interface UseThumbnailIntersectionReturn {
  /** Whether thumbnail is visible in viewport */
  readonly isVisible: boolean
  /** Whether thumbnail should be unmounted (far off-screen) */
  readonly shouldUnmount: boolean
  /** Ref to attach to thumbnail element */
  readonly thumbnailRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Custom hook for managing thumbnail visibility using Intersection Observer.
 * 
 * Unloads thumbnails far off-screen to free memory. This is important for
 * large documents where rendering all thumbnails would consume too much memory.
 * 
 * @returns Visibility state and ref for thumbnail element
 */
export function useThumbnailIntersection(): UseThumbnailIntersectionReturn {
  const [isVisible, setIsVisible] = React.useState(false)
  const [shouldUnmount, setShouldUnmount] = React.useState(false)
  const thumbnailRef = React.useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading and memory management
  // Unloads thumbnails far off-screen to free memory
  React.useEffect(() => {
    const element = thumbnailRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setShouldUnmount(false)
        } else {
          // Unmount when far off-screen to free memory
          // Calculate distance from viewport
          const rect = entry.boundingClientRect
          const viewportHeight = window.innerHeight
          const viewportTop = 0
          const viewportBottom = viewportHeight
          
          // Check if element is far above or below viewport
          const isFarAbove = rect.bottom < viewportTop - PDF_RENDER.UNMOUNT_DISTANCE
          const isFarBelow = rect.top > viewportBottom + PDF_RENDER.UNMOUNT_DISTANCE
          
          if (isFarAbove || isFarBelow) {
            setShouldUnmount(true)
          }
        }
      },
      { 
        rootMargin: INTERSECTION_OBSERVER.LOAD_MARGIN,
        threshold: INTERSECTION_OBSERVER.THRESHOLD
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

  return {
    isVisible,
    shouldUnmount,
    thumbnailRef,
  }
}
