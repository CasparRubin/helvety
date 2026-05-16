import * as lightPillar from "@helvety/light-pillar";
import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncHyperspeedStub({ onReady }: { onReady?: () => void }) {
      useEffect(() => {
        onReady?.();
      }, [onReady]);
      return <div data-testid="stub-hyperspeed" id="lights" />;
    },
}));

import { HeroHyperspeedBackdrop } from "./hero-hyperspeed-backdrop";

describe("HeroHyperspeedBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defers veil lift through scheduleWebglBackdropReady", async () => {
    const scheduleSpy = vi.spyOn(lightPillar, "scheduleWebglBackdropReady");

    const { container } = render(<HeroHyperspeedBackdrop />);

    const veil = container.querySelector(
      '[data-testid="hero-hyperspeed-veil"]'
    );
    expect(veil).toHaveClass("opacity-100");

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    scheduleSpy.mock.calls[0]?.[0]();

    await waitFor(() => {
      expect(veil).toHaveClass("opacity-0");
    });
  });

  it("lifts black veil after onReady with shared 700ms transition", async () => {
    const { container } = render(<HeroHyperspeedBackdrop />);

    expect(
      container.querySelector('[data-testid="stub-hyperspeed"]')
    ).not.toBeNull();

    const veil = container.querySelector(
      '[data-testid="hero-hyperspeed-veil"]'
    );
    expect(veil).not.toBeNull();

    for (const token of lightPillar.WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS.split(
      /\s+/
    )) {
      expect(veil).toHaveClass(token);
    }

    await waitFor(
      () => {
        expect(veil).toHaveClass("opacity-0");
      },
      { timeout: 3000 }
    );
  });

  it("uses the shared black underlay class on the base layer", () => {
    const { container } = render(<HeroHyperspeedBackdrop />);
    const host = container.querySelector(
      '[data-testid="hero-hyperspeed-veil"]'
    )?.parentElement;
    const underlay = host?.previousElementSibling;

    expect(underlay).toHaveClass("bg-black");
    for (const token of lightPillar.WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS.split(
      /\s+/
    )) {
      expect(underlay).toHaveClass(token);
    }
  });
});
