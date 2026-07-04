import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./slider";

/** No-op ResizeObserver stub for Radix Slider in jsdom. */
class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

describe("Slider", () => {
  it("renders with an accessible thumb label", () => {
    render(
      <Slider
        aria-label="Stroke"
        min={2}
        max={24}
        step={1}
        value={[8]}
        onValueChange={vi.fn()}
      />
    );

    expect(screen.getByRole("slider", { name: "Stroke" })).toHaveAttribute(
      "aria-valuenow",
      "8"
    );
  });

  it("forwards value changes", () => {
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="Blur"
        min={1}
        max={60}
        step={1}
        value={[12]}
        onValueChange={onValueChange}
      />
    );

    const slider = screen.getByRole("slider", { name: "Blur" });
    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(onValueChange).toHaveBeenCalled();
  });
});
