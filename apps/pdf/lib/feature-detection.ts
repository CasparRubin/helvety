/**
 * Feature detection utilities for browser capabilities.
 * Used to determine if advanced rendering features are available.
 */

/**
 * Checks if OffscreenCanvas is supported in the current browser.
 *
 * @returns True if OffscreenCanvas is supported, false otherwise
 */
function isOffscreenCanvasSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined"
  );
}

/**
 * Checks if ImageBitmap is supported in the current browser.
 *
 * @returns True if ImageBitmap is supported, false otherwise
 */
function isImageBitmapSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return typeof ImageBitmap !== "undefined";
}

/**
 * Checks if WebGL is supported in the current browser.
 *
 * @returns True if WebGL is supported, false otherwise
 */
function isWebGLSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl") ??
      canvas.getContext("webgl2")
    );
  } catch {
    return false;
  }
}

/**
 * Checks if WebGL2 is supported in the current browser.
 *
 * @returns True if WebGL2 is supported, false otherwise
 */
function isWebGL2Supported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Checks if transferControlToOffscreen is supported for canvas elements.
 *
 * @returns True if transferControlToOffscreen is supported, false otherwise
 */
function isTransferControlToOffscreenSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return typeof canvas.transferControlToOffscreen === "function";
  } catch {
    return false;
  }
}

/**
 * Checks if createImageBitmap is supported in the current browser.
 *
 * @returns True if createImageBitmap is supported, false otherwise
 */
function isCreateImageBitmapSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return typeof createImageBitmap !== "undefined";
}

/**
 * Rendering capabilities object indicating which features are available.
 */
export interface RenderingCapabilities {
  /** Whether OffscreenCanvas is supported */
  readonly offscreenCanvas: boolean;
  /** Whether ImageBitmap is supported */
  readonly imageBitmap: boolean;
  /** Whether createImageBitmap is supported */
  readonly createImageBitmap: boolean;
  /** Whether WebGL is supported */
  readonly webgl: boolean;
  /** Whether WebGL2 is supported */
  readonly webgl2: boolean;
  /** Whether transferControlToOffscreen is supported */
  readonly transferControlToOffscreen: boolean;
  /** Whether worker rendering can be used safely */
  readonly canUseWorkerRendering: boolean;
  /** Whether dedicated workers are supported */
  readonly worker: boolean;
  /** Whether GPU in workers is likely available */
  readonly canUseGpuWorkerPipeline: boolean;
  /** Whether worker-only processing pipeline is available */
  readonly canUseWorkerPipeline: boolean;
}

/**
 * Determines the best rendering strategy based on available browser features.
 *
 * @returns Object indicating which rendering strategies are available
 */
export function getRenderingCapabilities(): RenderingCapabilities {
  const offscreenCanvas = isOffscreenCanvasSupported();
  const imageBitmap = isImageBitmapSupported();
  const createImageBitmapSupported = isCreateImageBitmapSupported();
  const webgl = isWebGLSupported();
  const webgl2 = isWebGL2Supported();
  const transferControlToOffscreen = isTransferControlToOffscreenSupported();
  const worker = typeof Worker !== "undefined";

  return {
    offscreenCanvas,
    imageBitmap,
    createImageBitmap: createImageBitmapSupported,
    webgl,
    webgl2,
    transferControlToOffscreen,
    worker,
    // Rendering path for thumbnail optimization
    canUseWorkerRendering:
      worker &&
      offscreenCanvas &&
      imageBitmap &&
      createImageBitmapSupported &&
      transferControlToOffscreen,
    // Processing path in dedicated worker (no GPU requirement)
    canUseWorkerPipeline: worker,
    // Experimental GPU path (WebGL + OffscreenCanvas + ImageBitmap in worker)
    canUseGpuWorkerPipeline:
      worker &&
      offscreenCanvas &&
      imageBitmap &&
      createImageBitmapSupported &&
      (webgl || webgl2),
  };
}
