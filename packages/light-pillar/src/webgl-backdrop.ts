/** Semantic underlay while WebGL initializes (and in the dynamic `loading` slot). */
export const WEBGL_BACKDROP_UNDERLAY_CLASS = "absolute inset-0 bg-background";

/** Opacity fade duration (ms) on the fixed shell backdrop host. */
export const WEBGL_BACKDROP_HOST_REVEAL_MS = 700;

/** Opacity fade duration (ms) for a local veil over WebGL (hero Hyperspeed). */
export const WEBGL_BACKDROP_VEIL_REVEAL_MS = 700;

/** Shared opacity transition for host reveal and hero veil lift (`duration-700`). */
export const WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS =
  "transition-opacity duration-700 ease-out motion-reduce:transition-none";

/** Tailwind class for hero veil fade (same duration as host reveal). */
export const WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS =
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS;

/**
 * Schedules `fn` on the frame after WebGL reports ready so the first composited
 * frame is visible before reveal (host opacity or veil lift).
 */
export function scheduleWebglBackdropReady(fn: () => void): void {
  requestAnimationFrame(() => {
    fn();
  });
}
