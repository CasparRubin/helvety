/** Semantic underlay while WebGL initializes (and in the dynamic `loading` slot). */
export const WEBGL_BACKDROP_UNDERLAY_CLASS = "absolute inset-0 bg-background";

/** Opacity transition for hero backdrop fade-in (`duration-2000`). */
export const WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS =
  "transition-opacity duration-2000 ease-out motion-reduce:transition-none";

/**
 * Schedules `fn` on the frame after WebGL reports ready so the first composited
 * frame is painted before the backdrop fades in.
 */
export function scheduleWebglBackdropReady(fn: () => void): void {
  requestAnimationFrame(() => {
    fn();
  });
}
