import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOBILE_BREAKPOINT, useIsMobile } from "./use-is-mobile";

/** Listener shape used by mocked matchMedia subscription handlers in tests. */
type MatchMediaChangeListener = () => void;

describe("use-is-mobile", () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  let listeners: MatchMediaChangeListener[] = [];

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn(() => ({
        matches: window.innerWidth < MOBILE_BREAKPOINT,
        media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
        onchange: null,
        addEventListener: (_: string, listener: MatchMediaChangeListener) => {
          listeners.push(listener);
        },
        removeEventListener: (
          _: string,
          listener: MatchMediaChangeListener
        ) => {
          listeners = listeners.filter((existing) => existing !== listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("reflects viewport size changes through media query subscription", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: MOBILE_BREAKPOINT + 100,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: MOBILE_BREAKPOINT - 10,
      });
      for (const listener of listeners) listener();
    });

    expect(result.current).toBe(true);
  });
});
