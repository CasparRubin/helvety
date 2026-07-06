import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class FailingWebGLRenderer {
    constructor() {
      throw new Error("WebGL unsupported");
    }
  }
  return {
    ...actual,
    WebGLRenderer: FailingWebGLRenderer,
  };
});

import Hyperspeed from "./Hyperspeed";

describe("Hyperspeed init errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls onInitError when WebGL context creation throws", async () => {
    stubMatchMedia(false);
    const onInitError = vi.fn();
    const onReady = vi.fn();

    render(<Hyperspeed onReady={onReady} onInitError={onInitError} />);

    await waitFor(
      () => {
        expect(onInitError).toHaveBeenCalledTimes(1);
        expect(onReady).not.toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });
});
