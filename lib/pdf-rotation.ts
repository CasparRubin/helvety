import { PDFPage, degrees } from "pdf-lib"
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
 * Type guard to check if a rotation value is an object with an angle property.
 */
function isRotationObject(value: unknown): value is { angle: number } {
  return value !== null && typeof value === 'object' && 'angle' in value
}

/**
 * Extracts the rotation angle from a PDF page rotation value.
 * Handles both number and object formats.
 * 
 * @param rotationValue - The rotation value from PDFPage.getRotation()
 * @returns The rotation angle in degrees, or 0 if the value is invalid or NaN
 */
function extractRotationAngle(rotationValue: unknown): number {
  if (isRotationObject(rotationValue)) {
    const angle = rotationValue.angle
    return typeof angle === 'number' && !isNaN(angle) ? angle : 0
  }
  if (typeof rotationValue === 'number' && !isNaN(rotationValue)) {
    return rotationValue
  }
  return 0
}

/**
 * Applies rotation to a target PDF page, combining the original page rotation
 * with user-applied rotation. For images (pages that need dimension swapping),
 * this function will resize the page when rotating 90 or 270 degrees.
 * 
 * @param sourcePage - The original PDF page to read rotation from
 * @param targetPage - The target PDF page to apply rotation to
 * @param userRotation - The user-applied rotation in degrees (0, 90, 180, or 270)
 * @param isImage - Whether this page is from an image (needs dimension swapping on 90/270 rotation)
 */
export async function applyPageRotation(
  sourcePage: PDFPage,
  targetPage: PDFPage,
  userRotation: number,
  isImage: boolean = false
): Promise<void> {
  if (userRotation === 0) {
    return
  }

  try {
    // Get original page rotation and combine with user rotation
    const rotationObj = sourcePage.getRotation()
    const originalRotation = extractRotationAngle(rotationObj)
    const totalRotation = normalizeRotation(originalRotation + userRotation)
    
    // For images, when rotating 90 or 270 degrees, we need to swap page dimensions
    if (isImage && (userRotation === ROTATION_ANGLES.QUARTER || userRotation === ROTATION_ANGLES.THREE_QUARTER)) {
      const { width, height } = targetPage.getSize()
      // Swap dimensions for 90/270 degree rotations
      targetPage.setSize(height, width)
    }
    
    targetPage.setRotation(degrees(totalRotation))
  } catch {
    // If we can't read original rotation, just apply user rotation
    if (isImage && (userRotation === ROTATION_ANGLES.QUARTER || userRotation === ROTATION_ANGLES.THREE_QUARTER)) {
      const { width, height } = targetPage.getSize()
      targetPage.setSize(height, width)
    }
    targetPage.setRotation(degrees(userRotation))
  }
}

