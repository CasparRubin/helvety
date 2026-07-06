import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

import ElectricBorder from "./ElectricBorder";

describe("ElectricBorder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pauses RAF when the tab is hidden and resumes when visible", async () => {
    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 40,
      top: 0,
      left: 0,
      bottom: 40,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame");
    let rafId = 0;
    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation(() => {
        rafId += 1;
        return rafId;
      });

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      setTransform: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    render(
      <ElectricBorder color="#ff0000">
        <p>private · simple · clean</p>
      </ElectricBorder>
    );

    await waitFor(
      () => {
        expect(rafSpy).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    const callsBeforeHide = rafSpy.mock.calls.length;

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(
      () => {
        expect(cancelSpy).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    const callsAfterHide = rafSpy.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(rafSpy.mock.calls.length).toBe(callsAfterHide);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(
      () => {
        expect(rafSpy.mock.calls.length).toBeGreaterThan(callsBeforeHide);
      },
      { timeout: 500 }
    );
  });
});
