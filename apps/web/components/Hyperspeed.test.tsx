import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Hyperspeed from "./Hyperspeed";

/** Stubs `window.matchMedia` so `prefers-reduced-motion` is deterministic in jsdom. */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe("Hyperspeed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips WebGL under reduce motion; optional variation props and onReady are inert", async () => {
    stubMatchMedia(true);
    const onReady = vi.fn();
    const { container } = render(
      <Hyperspeed
        onReady={onReady}
        effectOptions={{
          variation: {
            enabled: true,
            intensity: 0.4,
            reseedIntervalMs: 2800,
            mobileScale: 0.5,
            maxDelta: 0.08,
          },
        }}
      />
    );
    const host = container.querySelector("#lights");
    expect(host).not.toBeNull();

    await waitFor(
      () => {
        expect(host?.querySelector("canvas")).toBeNull();
        expect(onReady).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });
});
