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

/** Parameters for drawing a spotlight dim ring outside a hole. */
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

/** Dims the stage outside a rounded or rectangular spotlight hole. */
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

  const localHoleX = holeX - groupOffsetX;
  const localHoleY = holeY - groupOffsetY;
  const localStageX = -groupOffsetX;
  const localStageY = -groupOffsetY;
  const clampedRadius = clampCornerRadius(cornerRadius, holeWidth, holeHeight);

  context.save();
  context.fillStyle = "black";
  context.globalAlpha = opacity;
  context.beginPath();
  context.rect(localStageX, localStageY, stageWidth, stageHeight);
  roundRectPath(
    context,
    localHoleX,
    localHoleY,
    holeWidth,
    holeHeight,
    clampedRadius
  );
  context.fill("evenodd");
  context.restore();
}
