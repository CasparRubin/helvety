import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isMobileDevice } from "./device-utils";

/**
 * Helper to create a mock MediaQueryList result.
 */
function mockMatchMedia(
  matchFn: (query: string) => boolean
): typeof window.matchMedia {
  return (query: string) => ({
    matches: matchFn(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

describe("isMobileDevice", () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia, so we define a default
    window.matchMedia = mockMatchMedia(() => false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when window is undefined (SSR)", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error -- simulating SSR
    delete globalThis.window;
    expect(isMobileDevice()).toBe(false);
    globalThis.window = originalWindow;
  });

  it("returns true for narrow viewport (phone)", () => {
    window.matchMedia = mockMatchMedia((q) => q === "(max-width: 768px)");
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 0,
      configurable: true,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("returns true for touch-primary device with touch points (tablet)", () => {
    window.matchMedia = mockMatchMedia((q) => q === "(pointer: coarse)");
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 5,
      configurable: true,
    });
    expect(isMobileDevice()).toBe(true);
  });

  it("returns false for desktop (wide viewport, no touch)", () => {
    window.matchMedia = mockMatchMedia(() => false);
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 0,
      configurable: true,
    });
    expect(isMobileDevice()).toBe(false);
  });
});
