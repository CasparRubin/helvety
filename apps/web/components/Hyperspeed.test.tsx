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

  it("renders #lights and skips WebGL when prefers-reduced-motion is reduce", async () => {
    stubMatchMedia(true);
    const { container } = render(<Hyperspeed />);
    const host = container.querySelector("#lights");
    expect(host).not.toBeNull();

    await waitFor(
      () => {
        expect(host?.querySelector("canvas")).toBeNull();
      },
      { timeout: 500 }
    );
  });

  it("accepts explicit variation options without breaking reduced-motion skip", async () => {
    stubMatchMedia(true);
    const { container } = render(
      <Hyperspeed
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
      },
      { timeout: 500 }
    );
  });
});
