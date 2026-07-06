/** Clamps corner radius to fit within a rectangle. */
export function clampCornerRadius(
  cornerRadius: number,
  width: number,
  height: number
): number {
  if (cornerRadius <= 0 || width <= 0 || height <= 0) {
    return 0;
  }
  return Math.min(cornerRadius, width / 2, height / 2);
}

/** Draws a rounded rectangle path on a canvas context. */
function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = clampCornerRadius(radius, width, height);
  if (r <= 0) {
    context.rect(x, y, width, height);
    return;
  }

  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, r);
    return;
  }

  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

/** A transparent hole punched out of a spotlight dim overlay. */
interface SpotlightHole {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly cornerRadius: number;
}

/** Parameters for drawing a spotlight dim with one or more holes. */
export interface SpotlightCutoutsParams {
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly holes: readonly SpotlightHole[];
  readonly opacity: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

/** Dims the stage once, then punches out each hole (union-safe for overlaps). */
export function drawSpotlightCutouts(
  context: CanvasRenderingContext2D,
  params: SpotlightCutoutsParams
): void {
  const {
    stageWidth,
    stageHeight,
    holes,
    opacity,
    offsetX = 0,
    offsetY = 0,
  } = params;

  if (holes.length === 0) {
    return;
  }

  context.save();
  context.fillStyle = "black";
  context.globalAlpha = opacity;
  context.fillRect(offsetX, offsetY, stageWidth, stageHeight);

  context.globalCompositeOperation = "destination-out";
  context.globalAlpha = 1;
  for (const hole of holes) {
    const clampedRadius = clampCornerRadius(
      hole.cornerRadius,
      hole.width,
      hole.height
    );
    context.beginPath();
    roundRectPath(
      context,
      hole.x,
      hole.y,
      hole.width,
      hole.height,
      clampedRadius
    );
    context.fill();
  }
  context.restore();
}

/** Parameters for drawing a single-hole spotlight dim (convenience wrapper). */
export interface SpotlightCutoutParams {
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly holeX: number;
  readonly holeY: number;
  readonly holeWidth: number;
  readonly holeHeight: number;
  readonly cornerRadius: number;
  readonly opacity: number;
  readonly groupOffsetX?: number;
  readonly groupOffsetY?: number;
}

/** Dims the stage outside one hole; delegates to {@link drawSpotlightCutouts}. */
export function drawSpotlightCutout(
  context: CanvasRenderingContext2D,
  params: SpotlightCutoutParams
): void {
  const {
    stageWidth,
    stageHeight,
    holeX,
    holeY,
    holeWidth,
    holeHeight,
    cornerRadius,
    opacity,
    groupOffsetX = 0,
    groupOffsetY = 0,
  } = params;

  drawSpotlightCutouts(context, {
    stageWidth,
    stageHeight,
    holes: [
      {
        x: holeX - groupOffsetX,
        y: holeY - groupOffsetY,
        width: holeWidth,
        height: holeHeight,
        cornerRadius,
      },
    ],
    opacity,
    offsetX: -groupOffsetX,
    offsetY: -groupOffsetY,
  });
}
