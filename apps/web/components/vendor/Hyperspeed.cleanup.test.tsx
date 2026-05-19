import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const domElement = document.createElement("canvas");

vi.mock("postprocessing", () => {
  class MockEffectComposer {
    addPass = vi.fn();
    render = vi.fn();
    setSize = vi.fn();
    dispose = vi.fn();
  }
  class MockPass {
    renderToScreen = false;
  }
  return {
    EffectComposer: MockEffectComposer,
    RenderPass: MockPass,
    EffectPass: MockPass,
    BloomEffect: vi.fn(),
    SMAAEffect: vi.fn(),
    SMAAPreset: { MEDIUM: 0 },
  };
});

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal();
  class MockWebGLRenderer {
    domElement = domElement;
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setClearColor = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    getContext = () => ({
      getContextAttributes: () => ({}),
    });
  }
  return Object.assign({}, actual, { WebGLRenderer: MockWebGLRenderer });
});
import Hyperspeed from "./Hyperspeed";

describe("Hyperspeed cleanup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("cancels the animation frame loop on unmount", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame");
    let rafId = 0;
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => {
      rafId += 1;
      return rafId;
    });

    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get: () => 800,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 600,
    });

    const { unmount } = render(<Hyperspeed />);

    await waitFor(
      () => {
        expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    unmount();

    await waitFor(
      () => {
        expect(cancelSpy).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });
});
