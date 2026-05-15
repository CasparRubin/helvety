import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

const lightPillarRenderSpy = vi.fn();

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncLightPillarStub(props: {
      onReady?: () => void;
      className?: string;
    }) {
      lightPillarRenderSpy(props);
      const { onReady } = props;
      useEffect(() => {
        requestAnimationFrame(() => {
          onReady?.();
        });
      }, [onReady]);
      return <div data-testid="stub-light-pillar" />;
    },
}));

import { StoreLightPillarBackdrop } from "./store-light-pillar-backdrop";
import { STORE_LIGHT_PILLAR_OPTIONS } from "./store-light-pillar-options";

describe("StoreLightPillarBackdrop", () => {
  it("lifts black veil after onReady", async () => {
    const { container } = render(<StoreLightPillarBackdrop />);

    expect(
      container.querySelector('[data-testid="stub-light-pillar"]')
    ).not.toBeNull();

    const veil = container.querySelector(
      '[data-testid="store-light-pillar-veil"]'
    );
    expect(veil).not.toBeNull();

    expect(veil).toHaveClass(
      "transition-opacity",
      "duration-500",
      "motion-reduce:transition-none"
    );

    await waitFor(
      () => {
        expect(veil).toHaveClass("opacity-0");
      },
      { timeout: 3000 }
    );
  });

  it("paints a black underlay behind the WebGL host", () => {
    const { container } = render(<StoreLightPillarBackdrop />);
    const blackBase = container.querySelector(
      '[data-testid="store-light-pillar-host"]'
    )?.previousElementSibling;
    expect(blackBase).toHaveClass("bg-black");
  });

  it("passes store preset options to LightPillar", () => {
    lightPillarRenderSpy.mockClear();
    render(<StoreLightPillarBackdrop />);

    expect(lightPillarRenderSpy).toHaveBeenCalled();
    const props = lightPillarRenderSpy.mock.calls.at(-1)?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        ...STORE_LIGHT_PILLAR_OPTIONS,
        className: "h-full w-full",
      })
    );
    expect(props?.onReady).toEqual(expect.any(Function));
  });
});
