import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LightPillar from "./LightPillar";

/** Stubs `window.matchMedia` so `prefers-reduced-motion` is deterministic in jsdom. */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

/** jsdom has no WebGL; stub a context so the reduce-motion path is testable. */
function stubWebGLContextAvailable(): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (type) => {
      if (type === "webgl" || type === "experimental-webgl") {
        return {} as WebGLRenderingContext;
      }
      return null;
    }
  );
}

describe("LightPillar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips WebGL under reduce motion and does not call onReady", async () => {
    stubWebGLContextAvailable();
    stubMatchMedia(true);
    const onReady = vi.fn();
    const { container } = render(
      <LightPillar onReady={onReady} quality="low" />
    );

    const host = container.querySelector(".light-pillar-container");
    expect(host).not.toBeNull();

    await waitFor(
      () => {
        expect(host?.querySelector("canvas")).toBeNull();
        expect(onReady).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it("calls onReady when WebGL is unavailable", async () => {
    stubMatchMedia(false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const onReady = vi.fn();
    const { container } = render(
      <LightPillar onReady={onReady} quality="low" />
    );

    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(
          container.querySelector(".light-pillar-fallback")
        ).not.toBeNull();
      },
      { timeout: 500 }
    );
  });
});
