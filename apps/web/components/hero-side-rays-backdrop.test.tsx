import * as webglBackdrop from "@helvety/light-pillar";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const sideRaysStubMocks = vi.hoisted(() => ({
  failInit: false,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncSideRaysStub({
      rayColor1,
      rayColor2,
      origin,
      onReady,
      onInitError,
    }: {
      rayColor1?: string;
      rayColor2?: string;
      origin?: string;
      onReady?: () => void;
      onInitError?: () => void;
    }) {
      useEffect(() => {
        if (sideRaysStubMocks.failInit) {
          onInitError?.();
          return;
        }
        onReady?.();
      }, [onReady, onInitError]);
      return (
        <div
          className="side-rays-container"
          data-origin={origin}
          data-ray-color-1={rayColor1}
          data-ray-color-2={rayColor2}
          data-testid="stub-side-rays"
        >
          <canvas />
        </div>
      );
    },
}));

import { HeroSideRaysBackdrop } from "./hero-side-rays-backdrop";

describe("HeroSideRaysBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sideRaysStubMocks.failInit = false;
  });

  it("SSR omits WebGL until client hydration", () => {
    const html = renderToStaticMarkup(<HeroSideRaysBackdrop />);

    expect(html).toContain('data-testid="hero-side-rays-reveal"');
    expect(html).toContain("opacity-0");
    expect(html).not.toContain('data-testid="stub-side-rays"');
    expect(html).not.toContain('data-testid="hero-side-rays-loading"');
  });

  it("defers backdrop fade-in through scheduleWebglBackdropReady", async () => {
    const scheduleSpy = vi.spyOn(webglBackdrop, "scheduleWebglBackdropReady");

    render(<HeroSideRaysBackdrop />);

    const reveal = screen.getByTestId("hero-side-rays-reveal");
    expect(reveal).toHaveClass("opacity-0");
    expect(reveal).toHaveClass("pointer-events-none");

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    scheduleSpy.mock.calls[0]?.[0]();

    await waitFor(() => {
      expect(reveal).toHaveClass("opacity-100");
    });
    expect(reveal).not.toHaveClass("pointer-events-none");
  });

  it("uses Helvety red and white rays from the top right", async () => {
    render(<HeroSideRaysBackdrop />);

    const sideRays = await screen.findByTestId("stub-side-rays");
    expect(sideRays).toHaveAttribute("data-ray-color-1", "#F43F5E");
    expect(sideRays).toHaveAttribute("data-ray-color-2", "#ffffff");
    expect(sideRays).toHaveAttribute("data-origin", "top-right");
  });

  it("keeps the reveal hidden when SideRays initialization fails", async () => {
    sideRaysStubMocks.failInit = true;

    render(<HeroSideRaysBackdrop />);

    await screen.findByTestId("stub-side-rays");

    expect(screen.getByTestId("hero-side-rays-reveal")).toHaveClass(
      "opacity-0"
    );
  });

  it("remounts and hides reveal after bfcache restore, then fades in again", async () => {
    const scheduleSpy = vi.spyOn(webglBackdrop, "scheduleWebglBackdropReady");

    render(<HeroSideRaysBackdrop />);

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });
    scheduleSpy.mock.calls[0]?.[0]();

    await waitFor(() => {
      expect(screen.getByTestId("hero-side-rays-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    fireEvent(
      window,
      new PageTransitionEvent("pageshow", { persisted: true })
    );

    expect(screen.getByTestId("hero-side-rays-reveal")).toHaveClass(
      "opacity-0"
    );

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalledTimes(2);
    });
    scheduleSpy.mock.calls[1]?.[0]();

    await waitFor(() => {
      expect(screen.getByTestId("hero-side-rays-reveal")).toHaveClass(
        "opacity-100"
      );
    });
  });
});
