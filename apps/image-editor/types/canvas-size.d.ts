/* eslint-disable jsdoc/require-jsdoc -- ambient module shapes for canvas-size */
declare module "canvas-size" {
  interface CanvasSizeResult {
    width: number;
    height: number;
    success?: boolean;
  }

  interface CanvasSize {
    maxWidth: () => false | Promise<CanvasSizeResult>;
    maxHeight: () => false | Promise<CanvasSizeResult>;
    maxArea: () => false | Promise<CanvasSizeResult>;
  }

  const canvasSize: CanvasSize;
  export default canvasSize;
}
