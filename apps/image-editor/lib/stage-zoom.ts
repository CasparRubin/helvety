export const USER_ZOOM_MIN = 0.25;

export const USER_ZOOM_MAX = 4;

export const USER_ZOOM_STEP = 0.25;

/** Clamps and snaps a user zoom multiplier to the allowed range. */
export function clampUserZoom(zoom: number): number {
  const snapped = Math.round(zoom / USER_ZOOM_STEP) * USER_ZOOM_STEP;
  return Math.min(USER_ZOOM_MAX, Math.max(USER_ZOOM_MIN, snapped));
}

/** Formats user zoom as a whole-number percentage (100% = no extra zoom beyond auto-fit). */
export function formatUserZoomPercent(userZoom: number): string {
  return `${Math.round(userZoom * 100)}%`;
}
