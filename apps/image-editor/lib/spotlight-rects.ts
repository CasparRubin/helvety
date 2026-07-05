/** A dimmed strip outside a spotlight hole, in stage coordinates. */
export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Returns a rect only when both dimensions are positive. */
function positiveRect(
  x: number,
  y: number,
  width: number,
  height: number
): SpotlightRect | null {
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { x, y, width, height };
}

/**
 * Returns up to four rectangles that dim everything outside a hole region.
 * Used for straight-corner highlights (`cornerRadius === 0`) and crop overlays.
 */
export function buildSpotlightRects(
  holeX: number,
  holeY: number,
  holeWidth: number,
  holeHeight: number,
  stageWidth: number,
  stageHeight: number
): SpotlightRect[] {
  const rects: SpotlightRect[] = [];

  const top = positiveRect(0, 0, stageWidth, holeY);
  const bottom = positiveRect(
    0,
    holeY + holeHeight,
    stageWidth,
    stageHeight - holeY - holeHeight
  );
  const left = positiveRect(0, holeY, holeX, holeHeight);
  const right = positiveRect(
    holeX + holeWidth,
    holeY,
    stageWidth - holeX - holeWidth,
    holeHeight
  );

  for (const rect of [top, bottom, left, right]) {
    if (rect) {
      rects.push(rect);
    }
  }

  return rects;
}
