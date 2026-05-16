import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
        onReady?.();
      }, [onReady]);
      return <div data-testid="stub-light-pillar" />;
    },
}));

import { HelvetyLightPillarBackdrop } from "./helvety-light-pillar-backdrop";
import { HELVETY_LIGHT_PILLAR_OPTIONS } from "./helvety-light-pillar-preset";
import * as webglBackdrop from "./webgl-backdrop";

describe("HelvetyLightPillarBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lightPillarRenderSpy.mockClear();
  });

  it("defers parent onReady through scheduleWebglBackdropReady", async () => {
    const scheduleSpy = vi.spyOn(webglBackdrop, "scheduleWebglBackdropReady");
    const onReady = vi.fn();

    render(<HelvetyLightPillarBackdrop onReady={onReady} />);

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    expect(onReady).not.toHaveBeenCalled();

    scheduleSpy.mock.calls[0]?.[0]();

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("calls onReady without a viewport veil", async () => {
    const onReady = vi.fn();
    const { container } = render(
      <HelvetyLightPillarBackdrop onReady={onReady} />
    );

    expect(
      container.querySelector('[data-testid="stub-light-pillar"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="helvety-light-pillar-veil"]')
    ).toBeNull();

    await waitFor(
      () => {
        expect(onReady).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  });

  it("paints the shared black underlay behind the WebGL host", () => {
    const { container } = render(<HelvetyLightPillarBackdrop />);
    const blackBase = container.querySelector(
      '[data-testid="helvety-light-pillar-host"]'
    )?.previousElementSibling;

    expect(blackBase).toHaveClass("bg-black");
    for (const token of webglBackdrop.WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS.split(
      /\s+/
    )) {
      expect(blackBase).toHaveClass(token);
    }
  });

  it("passes Helvety preset options to LightPillar", () => {
    render(<HelvetyLightPillarBackdrop />);

    expect(lightPillarRenderSpy).toHaveBeenCalled();
    const props = lightPillarRenderSpy.mock.calls.at(-1)?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        ...HELVETY_LIGHT_PILLAR_OPTIONS,
        className: "h-full w-full",
      })
    );
    expect(props?.onReady).toEqual(expect.any(Function));
  });
});
