/**
 * Utility functions for calculating optimal device pixel ratio for PDF thumbnails.
 * Optimizes quality vs memory usage based on screen size, container width, and document size.
 */

import { THUMBNAIL_QUALITY } from "./constants"

/**
 * Screen size type for DPR calculation.
 */
export type ScreenSize = "mobile" | "tablet" | "desktop"

/**
 * Parameters for calculating optimal DPR.
 */
export interface CalculateDPRParams {
  /** Screen size category */
  readonly screenSize: ScreenSize
  /** Container width in pixels */
  readonly containerWidth: number
  /** Total number of pages in the document */
  readonly totalPages: number
}

/**
 * Calculates optimal device pixel ratio based on screen size, container width, and total pages.
 * Reduces quality on smaller screens and when many pages are loaded to save memory.
 * 
 * The calculation applies multiple factors:
 * - Base DPR from screen size (mobile/tablet/desktop)
 * - Reduction for large document sets (50+, 100+, 200+ pages)
 * - Reduction for smaller container widths (< 300px, < 200px)
 * - Final value is clamped between MIN_DPR and MAX_DPR
 * 
 * @param params - Parameters for DPR calculation
 * @returns The calculated device pixel ratio, clamped between MIN_DPR and MAX_DPR
 * 
 * @example
 * ```typescript
 * const dpr = calculateOptimalDPR({
 *   screenSize: "desktop",
 *   containerWidth: 400,
 *   totalPages: 10
 * })
 * // Returns optimized DPR value
 * ```
 */
export function calculateOptimalDPR(params: CalculateDPRParams): number {
  const { screenSize, containerWidth, totalPages } = params
  
  // Base DPR from screen size
  let baseDPR: number
  if (screenSize === "mobile") {
    baseDPR = THUMBNAIL_QUALITY.MOBILE_DPR
  } else if (screenSize === "tablet") {
    baseDPR = THUMBNAIL_QUALITY.TABLET_DPR
  } else {
    baseDPR = THUMBNAIL_QUALITY.DESKTOP_DPR
  }

  // Reduce further if many pages (memory pressure)
  if (totalPages > 50) baseDPR *= 0.9
  if (totalPages > 100) baseDPR *= 0.85
  if (totalPages > 200) baseDPR *= 0.8

  // Reduce slightly for smaller containers
  if (containerWidth < 300) baseDPR *= 0.9
  if (containerWidth < 200) baseDPR *= 0.85

  // Cap at min and max
  return Math.max(
    THUMBNAIL_QUALITY.MIN_DPR,
    Math.min(baseDPR, THUMBNAIL_QUALITY.MAX_DPR)
  )
}
