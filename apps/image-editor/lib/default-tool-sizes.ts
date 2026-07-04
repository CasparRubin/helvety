/** Reference long edge (px) for “typical” screenshot scaling. */
const REFERENCE_LONG_EDGE = 1920;

export const FONT_SIZE_BASE = 36;
const FONT_SIZE_MIN = 18;
const FONT_SIZE_MAX = 128;

export const STROKE_WIDTH_BASE = 5;
export const STROKE_WIDTH_MIN = 2;
export const STROKE_WIDTH_MAX = 24;

/** Scale factor from image long edge vs {@link REFERENCE_LONG_EDGE}. */
export function imageScaleFactor(
  imageWidth: number,
  imageHeight: number
): number {
  const longEdge = Math.max(imageWidth, imageHeight);
  if (longEdge <= 0) return 1;
  return longEdge / REFERENCE_LONG_EDGE;
}

/** Clamps a numeric value to an inclusive min/max range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Default font size and stroke width scaled to the image dimensions. */
export function getDefaultToolSizes(
  imageWidth: number,
  imageHeight: number
): { fontSize: number; strokeWidth: number } {
  const scale = imageScaleFactor(imageWidth, imageHeight);
  return {
    fontSize: Math.round(
      clamp(FONT_SIZE_BASE * scale, FONT_SIZE_MIN, FONT_SIZE_MAX)
    ),
    strokeWidth: Math.round(
      clamp(STROKE_WIDTH_BASE * scale, STROKE_WIDTH_MIN, STROKE_WIDTH_MAX)
    ),
  };
}

/** Konva text shadow props derived from font size (canvas + export). */
export function getTextShadowProps(fontSize: number): {
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
} {
  return {
    shadowColor: "rgba(0,0,0,0.85)",
    shadowBlur: Math.max(2, fontSize * 0.12),
    shadowOffsetX: Math.max(1, fontSize * 0.04),
    shadowOffsetY: Math.max(1, fontSize * 0.04),
    shadowOpacity: 1,
  };
}

/** CSS text-shadow for the inline edit overlay. */
export function getTextShadowCss(fontSize: number): string {
  const offset = Math.max(1, Math.round(fontSize * 0.04));
  const blur = Math.max(2, Math.round(fontSize * 0.12));
  return `${offset}px ${offset}px ${blur}px rgba(0,0,0,0.85)`;
}
