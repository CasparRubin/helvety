import { HELVETY_ACCENT_RED } from "@helvety/brand";
import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
const lightPillarRenderSpy = vi.fn();

const themeMocks = vi.hoisted(() => ({
  isDark: true,
}));

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => themeMocks.isDark,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncLightPillarStub(props: {
      onReady?: () => void;
      className?: string;
      topColor?: string;
      bottomColor?: string;
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
import { getHelvetyLightPillarOptions } from "./helvety-light-pillar-preset";
import * as webglBackdrop from "./webgl-backdrop";

describe("HelvetyLightPillarBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    lightPillarRenderSpy.mockClear();
    themeMocks.isDark = true;
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

  it("paints the shared semantic underlay behind the WebGL host", () => {
    const { container } = render(<HelvetyLightPillarBackdrop />);
    const underlay = container.querySelector(
      '[data-testid="helvety-light-pillar-host"]'
    )?.previousElementSibling;

    expect(underlay).toHaveClass("bg-background");
    for (const token of webglBackdrop.WEBGL_BACKDROP_UNDERLAY_CLASS.split(
      /\s+/
    )) {
      expect(underlay).toHaveClass(token);
    }
  });

  it("passes white + red preset in dark mode", () => {
    themeMocks.isDark = true;
    render(<HelvetyLightPillarBackdrop />);

    expect(lightPillarRenderSpy).toHaveBeenCalled();
    const props = lightPillarRenderSpy.mock.calls.at(-1)?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        ...getHelvetyLightPillarOptions(true),
        className: "h-full w-full",
      })
    );
    expect(props?.topColor).toBe("#ffffff");
    expect(props?.bottomColor).toBe(HELVETY_ACCENT_RED);
  });

  it("passes black + red preset in light mode", () => {
    themeMocks.isDark = false;
    render(<HelvetyLightPillarBackdrop />);

    const props = lightPillarRenderSpy.mock.calls.at(-1)?.[0];
    expect(props?.topColor).toBe("#000000");
    expect(props?.bottomColor).toBe(HELVETY_ACCENT_RED);
  });
});
