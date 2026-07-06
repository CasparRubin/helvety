/**
 * Lightweight WebGL availability probe (create context, then release).
 * Use before mounting hero WebGL backdrops on unsupported devices.
 */
export function canUseWebGL(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      return false;
    }

    const loseContext = gl.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}
