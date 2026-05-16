import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const domElement = document.createElement("canvas");

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal();
  /**
   *
   */
  class MockWebGLRenderer {
    domElement = domElement;
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

import LightPillar from "./LightPillar";

describe("LightPillar cleanup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("clears the resize debounce timeout on unmount", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (type) => {
        if (type === "webgl" || type === "experimental-webgl") {
          return {} as WebGLRenderingContext;
        }
        return null;
      }
    );

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(<LightPillar quality="low" />);

    await vi.advanceTimersByTimeAsync(0);

    window.dispatchEvent(new Event("resize"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
