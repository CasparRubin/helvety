/**
 * Feature detection utilities for browser capabilities.
 * Used to determine if advanced rendering features are available.
 */

/**
 * Checks if OffscreenCanvas is supported in the current browser.
 *
 * @returns True if OffscreenCanvas is supported, false otherwise
 */
export function isOffscreenCanvasSupported(): boolean {
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
export function isImageBitmapSupported(): boolean {
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
export function isWebGLSupported(): boolean {
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
export function isWebGL2Supported(): boolean {
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
export function isTransferControlToOffscreenSupported(): boolean {
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
export function isCreateImageBitmapSupported(): boolean {
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
  /** Whether worker rendering can be used (requires OffscreenCanvas + ImageBitmap) */
  readonly canUseWorkerRendering: boolean;
}

/**
 * Determines the best rendering strategy based on available browser features.
 *
 * @returns Object indicating which rendering strategies are available
 */
export function getRenderingCapabilities(): RenderingCapabilities {
  return {
    offscreenCanvas: isOffscreenCanvasSupported(),
    imageBitmap: isImageBitmapSupported(),
    createImageBitmap: isCreateImageBitmapSupported(),
    webgl: isWebGLSupported(),
    webgl2: isWebGL2Supported(),
    transferControlToOffscreen: isTransferControlToOffscreenSupported(),
    // Best strategy: OffscreenCanvas + ImageBitmap
    canUseWorkerRendering:
      isOffscreenCanvasSupported() && isImageBitmapSupported(),
  };
}
