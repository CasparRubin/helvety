/**
 * Typed wrapper for the untyped `canvas-size` package.
 * Apps import canvas limits via `@helvety/shared/canvas-export-limits` only.
 */

/** Options accepted by canvas-size probe helpers. */
export interface CanvasSizeOptions {
  max?: number | null;
  min?: number;
  step?: number;
  useWorker?: boolean;
  sizes?: number[][];
}

/** Result row from a canvas-size width/height/area probe. */
export interface CanvasSizeResult {
  width: number;
  height: number;
  success?: boolean;
  testTime?: number;
  totalTime?: number;
}

/** Public API surface used from `canvas-size`. */
export interface CanvasSizeApi {
  maxArea(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
  maxHeight(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
  maxWidth(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
  test(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
}

// @ts-expect-error -- canvas-size ships JS without TypeScript types
import untypedCanvasSize from "canvas-size";

const canvasSize = untypedCanvasSize as CanvasSizeApi;

export default canvasSize;
