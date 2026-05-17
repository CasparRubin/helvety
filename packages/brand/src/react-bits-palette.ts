/**
 * React Bits WebGL brand pair: dark = white + red, light = black + red.
 * Scene canvas backgrounds match {@link sharedViewport} theme-color meta.
 */

/** 24-bit primary for Three.js Hyperspeed lane lines (`0xffffff` / `0x000000`). */
export const REACT_BITS_PRIMARY_RGB_DARK = 0xffffff;

export const REACT_BITS_PRIMARY_RGB_LIGHT = 0x000000;

/** Hyperspeed clear color — light `theme-color` (`prefers-color-scheme: light`). */
export const HELVETY_CANVAS_BACKGROUND_LIGHT = 0xfaf8f7;

/** Hyperspeed clear color — dark `theme-color` (`prefers-color-scheme: dark`). */
export const HELVETY_CANVAS_BACKGROUND_DARK = 0x1c1816;

/**
 * Hyperspeed road in light mode — warm asphalt, clearly recessed vs
 * {@link HELVETY_CANVAS_BACKGROUND_LIGHT} (was ~4% contrast; too flat to read as a street).
 */
export const HELVETY_CANVAS_ROAD_LIGHT = 0xcbc5be;

/** Slightly lighter than dark canvas for Hyperspeed road surface. */
export const HELVETY_CANVAS_ROAD_DARK = 0x080808;

/** Island divider between lanes (light scene; darker than road, same as dark-mode hierarchy). */
export const HELVETY_CANVAS_ISLAND_LIGHT = 0xb5aea6;

/** Island divider between lanes (dark scene). */
export const HELVETY_CANVAS_ISLAND_DARK = 0x0a0a0a;

/** Black headlight / oncoming streaks in light mode. */
export const REACT_BITS_HEADLIGHT_RGB_LIGHT = [
  0x000000, 0x111111, 0x1a1a1a,
] as const;

/** Near-white headlight streaks in dark mode. */
export const REACT_BITS_HEADLIGHT_RGB_DARK = [
  0xf5f5f5, 0xffffff, 0xffe8e8,
] as const;

/** Primary as 24-bit RGB for Three.js Hyperspeed colors. */
export function getReactBitsPrimaryRgb(isDark: boolean): number {
  return isDark ? REACT_BITS_PRIMARY_RGB_DARK : REACT_BITS_PRIMARY_RGB_LIGHT;
}

/** Scene clear / sky color for Hyperspeed. */
export function getHelvetyCanvasBackgroundRgb(isDark: boolean): number {
  return isDark
    ? HELVETY_CANVAS_BACKGROUND_DARK
    : HELVETY_CANVAS_BACKGROUND_LIGHT;
}

/** Road surface color for Hyperspeed. */
export function getHelvetyCanvasRoadRgb(isDark: boolean): number {
  return isDark ? HELVETY_CANVAS_ROAD_DARK : HELVETY_CANVAS_ROAD_LIGHT;
}

/** Lane island color for Hyperspeed. */
export function getHelvetyCanvasIslandRgb(isDark: boolean): number {
  return isDark ? HELVETY_CANVAS_ISLAND_DARK : HELVETY_CANVAS_ISLAND_LIGHT;
}

/** Oncoming car streak colors (white-ish dark, black-ish light). */
export function getReactBitsHeadlightRgb(
  isDark: boolean
): readonly [number, number, number] {
  return isDark
    ? REACT_BITS_HEADLIGHT_RGB_DARK
    : REACT_BITS_HEADLIGHT_RGB_LIGHT;
}
