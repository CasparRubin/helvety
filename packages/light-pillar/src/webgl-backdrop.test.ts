import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS,
  WEBGL_BACKDROP_HOST_REVEAL_MS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
  WEBGL_BACKDROP_VEIL_REVEAL_MS,
  WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS,
} from "./webgl-backdrop";

describe("webgl-backdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports shared underlay and transition classes", () => {
    expect(WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS).toBe(
      "absolute inset-0 bg-black"
    );
    expect(WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS).toBe(
      "transition-opacity duration-700 ease-out motion-reduce:transition-none"
    );
    expect(WEBGL_BACKDROP_HOST_REVEAL_MS).toBe(700);
    expect(WEBGL_BACKDROP_VEIL_REVEAL_MS).toBe(700);
    expect(WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS).toBe(
      WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS
    );
  });

  it("scheduleWebglBackdropReady runs fn on the next animation frame", () => {
    const fn = vi.fn();
    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    scheduleWebglBackdropReady(fn);

    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
