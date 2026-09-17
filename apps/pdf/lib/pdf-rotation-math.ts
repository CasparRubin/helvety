import { ROTATION_ANGLES } from "./constants";

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
 * Combines inherent PDF metadata rotation with user-applied rotation.
 * Matches the angle shown in thumbnails (react-pdf rotate prop).
 */
export function computeEffectiveRotation(
  inherentRotation: number,
  userRotation: number
): number {
  return normalizeRotation(inherentRotation + userRotation);
}
