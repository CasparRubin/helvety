/** Minimal canvas context used to draw tapered arrow paths. */
export interface TaperedArrowContext {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
}

/**
 * Builds a closed polygon (flat `[x, y, …]`) for a tapered arrow from tail to head.
 * The shaft is thinner at the tail and widens toward the neck; a distinct pointy
 * head flares outward from the neck to the tip.
 */
export function buildTaperedArrowPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number
): number[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  if (length < 0.001) {
    return [x1, y1, x1, y1, x1, y1];
  }

  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const tailHalf = strokeWidth * 0.25;
  const headHalf = strokeWidth * 2;
  const shaftEndHalf = Math.min(strokeWidth * 0.65, headHalf * 0.75);
  const headLength = Math.min(strokeWidth * 4, length * 0.4);
  const shaftLength = length - headLength;

  const baseX = x1 + ux * shaftLength;
  const baseY = y1 + uy * shaftLength;

  return [
    x1 + px * tailHalf,
    y1 + py * tailHalf,
    baseX + px * shaftEndHalf,
    baseY + py * shaftEndHalf,
    baseX + px * headHalf,
    baseY + py * headHalf,
    x2,
    y2,
    baseX - px * headHalf,
    baseY - py * headHalf,
    baseX - px * shaftEndHalf,
    baseY - py * shaftEndHalf,
    x1 - px * tailHalf,
    y1 - py * tailHalf,
  ];
}

/** Fills a tapered arrow path on a canvas context. */
export function drawTaperedArrowPath(
  context: TaperedArrowContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number
): void {
  const points = buildTaperedArrowPoints(x1, y1, x2, y2, strokeWidth);
  context.beginPath();
  context.moveTo(points[0]!, points[1]!);
  for (let index = 2; index < points.length; index += 2) {
    context.lineTo(points[index]!, points[index + 1]!);
  }
  context.closePath();
}
