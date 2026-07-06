import * as webglBackdrop from "@helvety/light-pillar";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const themeMocks = vi.hoisted(() => ({
  isDark: true,
  readDark: true,
}));

const hyperspeedStubMocks = vi.hoisted(() => ({
  failInit: false,
}));

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => themeMocks.isDark,
  readHtmlDarkTheme: () => themeMocks.readDark,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncHyperspeedStub({
      onReady,
      onInitError,
    }: {
      onReady?: () => void;
      onInitError?: () => void;
    }) {
      useEffect(() => {
        if (hyperspeedStubMocks.failInit) {
          onInitError?.();
          return;
        }
        onReady?.();
      }, [onReady, onInitError]);
      return (
        <div data-testid="stub-hyperspeed" id="lights">
          <canvas />
        </div>
      );
    },
}));

import * as heroHyperspeedOptions from "@/components/hero-hyperspeed-options";

import { HeroHyperspeedBackdrop } from "./hero-hyperspeed-backdrop";

describe("HeroHyperspeedBackdrop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    themeMocks.isDark = true;
    themeMocks.readDark = true;
    hyperspeedStubMocks.failInit = false;
    document.documentElement.classList.remove("dark");
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

  it("fades in reveal wrapper after onReady with shared 2000ms transition", async () => {
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
    themeMocks.readDark = false;
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

  it("keeps reveal hidden when WebGL init fails", async () => {
    hyperspeedStubMocks.failInit = true;
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("stub-hyperspeed")).toBeInTheDocument();
    });

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
    expect(reveal).toHaveClass("opacity-0");
    expect(reveal).toHaveClass("pointer-events-none");

    await waitFor(
      () => {
        expect(reveal).toHaveClass("opacity-0");
      },
      { timeout: 500 }
    );
  });

  it("does not reveal when DOM theme disagrees with hook on ready", async () => {
    const scheduleSpy = vi.spyOn(webglBackdrop, "scheduleWebglBackdropReady");
    themeMocks.isDark = true;
    themeMocks.readDark = false;

    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(scheduleSpy).toHaveBeenCalled();
    });

    scheduleSpy.mock.calls.at(-1)?.[0]();

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
    expect(reveal).toHaveClass("opacity-0");
    expect(reveal).toHaveClass("pointer-events-none");
  });

  it("prefers dark effect options when html.dark is set before hook resolves", async () => {
    const optionsSpy = vi.spyOn(
      heroHyperspeedOptions,
      "getHeroHyperspeedEffectOptions"
    );
    themeMocks.isDark = false;
    themeMocks.readDark = false;
    document.documentElement.classList.add("dark");

    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(optionsSpy).toHaveBeenCalledWith(true);
    });
  });

  it("hides reveal on visibilitychange to hidden", async () => {
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
      "opacity-0"
    );
  });

  it("hides reveal on pagehide", async () => {
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      fireEvent(window, new Event("pagehide"));
    });

    expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
      "opacity-0"
    );
  });

  it("resets reveal on bfcache pageshow then fades in again after remount", async () => {
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      fireEvent(
        window,
        new PageTransitionEvent("pageshow", { persisted: true })
      );
    });

    const reveal = screen.getByTestId("hero-hyperspeed-reveal");
    expect(reveal).toHaveClass("opacity-0");

    await waitFor(() => {
      expect(reveal).toHaveClass("opacity-100");
    });
  });

  it("re-reveals when the tab becomes visible again", async () => {
    render(<HeroHyperspeedBackdrop />);

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
      "opacity-0"
    );

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });
  });

  it("hides reveal on cross-zone link pointerdown", async () => {
    render(
      <>
        <HeroHyperspeedBackdrop />
        <a href="/store" data-testid="store-link">
          Store
        </a>
      </>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      fireEvent.pointerDown(screen.getByTestId("store-link"), {
        bubbles: true,
      });
    });

    expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
      "opacity-0"
    );
  });

  it("keeps reveal visible on in-gateway link pointerdown", async () => {
    render(
      <>
        <HeroHyperspeedBackdrop />
        <a href="/privacy" data-testid="privacy-link">
          Privacy
        </a>
      </>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
        "opacity-100"
      );
    });

    act(() => {
      fireEvent.pointerDown(screen.getByTestId("privacy-link"), {
        bubbles: true,
      });
    });

    expect(screen.getByTestId("hero-hyperspeed-reveal")).toHaveClass(
      "opacity-100"
    );
  });
});
