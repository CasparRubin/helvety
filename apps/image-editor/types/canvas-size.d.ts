/* eslint-disable jsdoc/require-jsdoc -- ambient module shapes for canvas-size */
declare module "canvas-size" {
  interface CanvasSizeOptions {
    max?: number | null;
    min?: number;
    step?: number;
    useWorker?: boolean;
    sizes?: number[][];
  }

  interface CanvasSizeResult {
    width: number;
    height: number;
    success?: boolean;
    testTime?: number;
    totalTime?: number;
  }

  interface CanvasSizeApi {
    maxArea(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
    maxHeight(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
    maxWidth(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
    test(options?: CanvasSizeOptions): false | Promise<CanvasSizeResult>;
  }

  const canvasSize: CanvasSizeApi;
  export default canvasSize;
}
