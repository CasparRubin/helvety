import * as webglBackdrop from "@helvety/light-pillar";
import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const themeMocks = vi.hoisted(() => ({
  isDark: true,
}));

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => themeMocks.isDark,
}));

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
    themeMocks.isDark = true;
  });

  it("SSR omits WebGL until client hydration", () => {
    const html = renderToStaticMarkup(<HeroHyperspeedBackdrop />);

    expect(html).toContain('data-testid="hero-hyperspeed-reveal"');
    expect(html).toContain("opacity-0");
    expect(html).not.toContain('data-testid="stub-hyperspeed"');
    expect(html).not.toContain('data-testid="hero-hyperspeed-loading"');
  });

  it("defers backdrop fade-in through scheduleWebglBackdropReady", async () => {
    const scheduleSpy = vi.spyOn(webglBackdrop, "scheduleWebglBackdropReady");

    render(<HeroHyperspeedBackdrop />);

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
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

  it("fades in reveal wrapper after onReady with shared 700ms transition", async () => {
    render(<HeroHyperspeedBackdrop />);

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");

    for (const token of webglBackdrop.WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS.split(
      /\s+/
    )) {
      expect(reveal).toHaveClass(token);
    }

    await waitFor(
      () => {
        expect(reveal).toHaveClass("opacity-100");
      },
      { timeout: 3000 }
    );
  });

  it("uses the shared semantic underlay class on the base layer", () => {
    render(<HeroHyperspeedBackdrop />);
    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
    const underlay = reveal.firstElementChild;

    expect(underlay).toBeTruthy();
    for (const token of webglBackdrop.WEBGL_BACKDROP_UNDERLAY_CLASS.split(
      /\s+/
    )) {
      expect(underlay).toHaveClass(token);
    }
  });

  it("resets reveal when theme switches then fades in again", async () => {
    const { rerender } = render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    themeMocks.isDark = false;
    rerender(<HeroHyperspeedBackdrop />);

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
    expect(reveal).toHaveClass("opacity-0");
    expect(reveal).toHaveClass("pointer-events-none");

    await waitFor(() => {
      expect(reveal).toHaveClass("opacity-100");
    });
    expect(reveal).not.toHaveClass("pointer-events-none");
  });

  it("mounts WebGL after client hydration", async () => {
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("stub-hyperspeed")).toBeInTheDocument();
    });
  });
});
