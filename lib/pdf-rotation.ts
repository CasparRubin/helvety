// External libraries
import { degrees } from "pdf-lib";

// Internal utilities
import { ROTATION_ANGLES } from "./constants";
import { validateFiniteNumber } from "./validation-utils";

import type { PDFDocument, PDFPage } from "pdf-lib";

/**
 * Normalizes a rotation angle to 0, 90, 180, or 270 degrees.
 *
 * @param angle - The rotation angle in degrees
 * @returns Normalized angle (0, 90, 180, or 270)
 */
export function normalizeRotation(angle: number): number {
  let normalized = angle % ROTATION_ANGLES.FULL;
  if (normalized < 0) normalized += ROTATION_ANGLES.FULL;
  return (
    (Math.round(normalized / ROTATION_ANGLES.INCREMENT) *
      ROTATION_ANGLES.INCREMENT) %
    ROTATION_ANGLES.FULL
  );
}

/**
 * Checks if a rotation angle requires content transformation for images.
 * 90° and 270° rotations need special handling because they swap dimensions.
 *
 * @param rotation - The normalized rotation angle
 * @returns True if the rotation requires content transformation
 */
export function needsContentTransform(rotation: number): boolean {
  const normalized = normalizeRotation(rotation);
  return (
    normalized === ROTATION_ANGLES.QUARTER ||
    normalized === ROTATION_ANGLES.THREE_QUARTER
  );
}

/**
 * Creates a rotated page for an image with actual content transformation.
 *
 * Unlike setRotation() which only sets viewing metadata, this function actually
 * transforms the image content by embedding the source page and drawing it
 * with rotation. This properly handles landscape-to-portrait (and vice versa)
 * conversions without leaving white space.
 *
 * Primarily used for 90° and 270° rotations where dimensions need to be swapped.
 * For 180° rotations, applyPageRotation() with metadata is sufficient and more efficient.
 *
 * @param targetPdf - The PDF document to add the rotated page to
 * @param sourcePage - The original page containing the image
 * @param rotation - The rotation angle in degrees (typically 90 or 270)
 * @returns The newly created page with properly rotated content
 */
export async function createRotatedImagePage(
  targetPdf: PDFDocument,
  sourcePage: PDFPage,
  rotation: number
): Promise<PDFPage> {
  const normalizedRotation = normalizeRotation(rotation);
  const { width, height } = sourcePage.getSize();

  // Embed the source page for drawing
  const embeddedPage = await targetPdf.embedPage(sourcePage);

  // For 90° and 270°, swap dimensions; for 180°, keep same dimensions
  const needsSwap =
    normalizedRotation === ROTATION_ANGLES.QUARTER ||
    normalizedRotation === ROTATION_ANGLES.THREE_QUARTER;

  const newWidth = needsSwap ? height : width;
  const newHeight = needsSwap ? width : height;

  // Create a new page with the correct dimensions
  const newPage = targetPdf.addPage([newWidth, newHeight]);

  // Calculate position based on rotation
  // PDF coordinates have origin at bottom-left, and rotation is counter-clockwise
  let x: number;
  let y: number;

  switch (normalizedRotation) {
    case ROTATION_ANGLES.QUARTER: // 90° clockwise
      // After 90° CCW rotation in PDF terms, content needs to be positioned at (height, 0)
      x = height;
      y = 0;
      break;
    case ROTATION_ANGLES.HALF: // 180°
      // After 180° rotation, content needs to be positioned at (width, height)
      x = width;
      y = height;
      break;
    case ROTATION_ANGLES.THREE_QUARTER: // 270° clockwise (90° CCW)
      // After 270° CCW rotation in PDF terms, content needs to be positioned at (0, width)
      x = 0;
      y = width;
      break;
    default:
      // No rotation needed
      x = 0;
      y = 0;
  }

  // Draw the embedded page with rotation transformation
  newPage.drawPage(embeddedPage, {
    x,
    y,
    rotate: degrees(normalizedRotation),
  });

  return newPage;
}

/**
 * Applies rotation to a target PDF page using rotation metadata.
 *
 * This function sets the /Rotate entry in the PDF page dictionary, which tells
 * PDF viewers how to display the content. This works correctly for PDF pages
 * but NOT for images (use createRotatedImagePage for images with 90/270 rotation).
 *
 * @param sourcePage - The original PDF page (not used, kept for API compatibility)
 * @param targetPage - The target PDF page to apply rotation to
 * @param userRotation - The absolute total rotation in degrees (0, 90, 180, or 270) from state
 * @param isImage - Whether this page is from an image (only affects 180° rotation handling)
 */
export async function applyPageRotation(
  _sourcePage: PDFPage,
  targetPage: PDFPage,
  userRotation: number,
  isImage: boolean = false
): Promise<void> {
  // Validate inputs
  if (!targetPage || typeof targetPage.setRotation !== "function") {
    throw new Error(
      "Invalid targetPage provided. Expected a PDFPage instance with setRotation method."
    );
  }

  validateFiniteNumber(userRotation, "rotation angle");

  if (userRotation === 0) {
    return;
  }

  const normalizedUserRotation = normalizeRotation(userRotation);

  // For images with 180° rotation, we can still use setRotation as it doesn't change dimensions
  // For 90/270° image rotations, the caller should use createRotatedImagePage instead
  if (isImage && normalizedUserRotation === ROTATION_ANGLES.HALF) {
    // 180° rotation doesn't need dimension swap, just rotation metadata
    targetPage.setRotation(degrees(normalizedUserRotation));
    return;
  }

  // For PDFs, setRotation works correctly as viewers interpret the metadata
  targetPage.setRotation(degrees(normalizedUserRotation));
}
