import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import { useStageFit } from "./use-stage-fit";

describe("useStageFit", () => {
  it("scales down when the container is smaller than the logical stage", () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      const fitScale = useStageFit(containerRef, 1000, 500);
      return { containerRef, fitScale };
    });

    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({
      width: 520,
      height: 300,
      top: 0,
      left: 0,
      right: 520,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    result.current.containerRef.current = element;

    const { result: updated } = renderHook(() =>
      useStageFit(result.current.containerRef, 1000, 500)
    );

    expect(updated.current).toBeLessThan(1);
    expect(updated.current).toBeGreaterThan(0);
  });

  it("returns 1 when logical dimensions are unset", () => {
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement>(null);
      return useStageFit(containerRef, 0, 0);
    });

    expect(result.current).toBe(1);
  });

  it("fits a very large image entirely inside the container", () => {
    const containerRef = { current: null as HTMLDivElement | null };

    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    containerRef.current = element;

    const { result } = renderHook(() => useStageFit(containerRef, 4000, 3000));

    expect(result.current).toBeLessThan(1);
    expect(result.current * 4000).toBeLessThanOrEqual(800 - 32);
    expect(result.current * 3000).toBeLessThanOrEqual(600 - 32);
  });
});
