/** Semantic underlay while WebGL initializes (and in the dynamic `loading` slot). */
export const WEBGL_BACKDROP_UNDERLAY_CLASS = "absolute inset-0 bg-background";

/** Opacity transition for hero veil lift (`duration-700`). */
export const WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS =
  "transition-opacity duration-700 ease-out motion-reduce:transition-none";

/**
 * Schedules `fn` on the frame after WebGL reports ready so the first composited
 * frame is visible before the veil lifts.
 */
export function scheduleWebglBackdropReady(fn: () => void): void {
  requestAnimationFrame(() => {
    fn();
  });
}
