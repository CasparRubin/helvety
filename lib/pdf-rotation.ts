// External libraries
import { PDFPage, degrees } from "pdf-lib"

// Internal utilities
import { ROTATION_ANGLES } from "./constants"

/**
 * Normalizes a rotation angle to 0, 90, 180, or 270 degrees.
 * 
 * @param angle - The rotation angle in degrees
 * @returns Normalized angle (0, 90, 180, or 270)
 */
export function normalizeRotation(angle: number): number {
  let normalized = angle % ROTATION_ANGLES.FULL
  if (normalized < 0) normalized += ROTATION_ANGLES.FULL
  return Math.round(normalized / ROTATION_ANGLES.INCREMENT) * ROTATION_ANGLES.INCREMENT % ROTATION_ANGLES.FULL
}

/**
 * Applies rotation to a target PDF page. The userRotation parameter from state
 * represents the absolute total rotation the user wants (0, 90, 180, or 270 degrees).
 * This value is applied directly to the target page, fixing the bug where rapid rotation
 * clicks caused incorrect rotation by incorrectly treating userRotation as relative.
 * 
 * For images (pages that need dimension swapping), this function will resize the
 * page when rotating 90 or 270 degrees.
 * 
 * @param sourcePage - The original PDF page (not used, kept for API compatibility)
 * @param targetPage - The target PDF page to apply rotation to
 * @param userRotation - The absolute total rotation in degrees (0, 90, 180, or 270) from state
 * @param isImage - Whether this page is from an image (needs dimension swapping on 90/270 rotation)
 */
export async function applyPageRotation(
  sourcePage: PDFPage,
  targetPage: PDFPage,
  userRotation: number,
  isImage: boolean = false
): Promise<void> {
  // Validate inputs
  if (!targetPage || typeof targetPage.setRotation !== 'function') {
    throw new Error('Invalid targetPage provided. Expected a PDFPage instance.')
  }

  if (!Number.isFinite(userRotation)) {
    throw new Error(`Invalid rotation angle: ${userRotation}. Must be a finite number.`)
  }

  if (userRotation === 0) {
    return
  }

  const normalizedUserRotation = normalizeRotation(userRotation)

  if (isImage && (normalizedUserRotation === ROTATION_ANGLES.QUARTER || normalizedUserRotation === ROTATION_ANGLES.THREE_QUARTER)) {
    const { width, height } = targetPage.getSize()
    targetPage.setSize(height, width)
  }
  
  targetPage.setRotation(degrees(normalizedUserRotation))
}

