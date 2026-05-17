import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const backdropMocks = vi.hoisted(() => ({
  deferReady: false,
  fireReady: () => {},
  isMobile: false,
  isDark: true,
}));

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
});

afterEach(() => {
  backdropMocks.deferReady = false;
  backdropMocks.isMobile = false;
  backdropMocks.isDark = true;
  vi.unstubAllGlobals();
});

vi.mock("@helvety/ui/use-is-mobile", () => ({
  useIsMobile: () => backdropMocks.isMobile,
}));

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => backdropMocks.isDark,
}));

vi.mock("./helvety-light-pillar-backdrop", () => ({
  HelvetyLightPillarBackdrop: ({ onReady }: { onReady?: () => void }) => {
    backdropMocks.fireReady = () => {
      onReady?.();
    };
    if (!backdropMocks.deferReady) {
      queueMicrotask(() => {
        onReady?.();
      });
    }
    return <div data-testid="mock-helvety-light-pillar-backdrop" />;
  },
}));

vi.mock("./wait-for-shell-content-painted", () => ({
  waitForShellContentPainted: vi.fn(() => Promise.resolve()),
}));

import { HelvetyShellWithLightPillarBackdrop } from "./helvety-shell-with-light-pillar-backdrop";
import { waitForShellContentPainted } from "./wait-for-shell-content-painted";
import { WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS } from "./webgl-backdrop";

/** Renders the shell wrapper with default child content for assertions. */
function renderShell() {
  return render(
    <HelvetyShellWithLightPillarBackdrop>
      <p>Shell content</p>
    </HelvetyShellWithLightPillarBackdrop>
  );
}

describe("HelvetyShellWithLightPillarBackdrop", () => {
  describe("desktop dark viewport (WebGL enabled)", () => {
    it("renders content immediately and defers backdrop until shell painted", async () => {
      renderShell();

      expect(screen.getByText("Shell content")).toBeInTheDocument();
      expect(waitForShellContentPainted).toHaveBeenCalled();
      expect(
        screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
      ).toBeNull();

      await waitFor(() => {
        expect(
          screen.getByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeInTheDocument();
      });
    });

    it("reveals the fixed host with a clean opacity transition after pillar onReady", async () => {
      renderShell();

      const fixedHost = await waitFor(() =>
        screen.getByTestId("helvety-shell-light-pillar-fixed-host")
      );

      for (const token of WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS.split(/\s+/)) {
        expect(fixedHost).toHaveClass(token);
      }

      await waitFor(() => {
        expect(fixedHost).toHaveClass("opacity-100");
      });
    });

    it("keeps fixed host at opacity-0 until pillar onReady", async () => {
      backdropMocks.deferReady = true;
      renderShell();

      const fixedHost = await waitFor(() =>
        screen.getByTestId("helvety-shell-light-pillar-fixed-host")
      );

      expect(fixedHost).toHaveClass("opacity-0");
      expect(fixedHost).not.toHaveClass("opacity-100");

      backdropMocks.fireReady();

      await waitFor(() => {
        expect(fixedHost).toHaveClass("opacity-100");
      });
    });

    it("pins shell content above backdrop and hides static fallback on md+", async () => {
      renderShell();

      const staticFallback = screen.getByTestId(
        "helvety-shell-light-pillar-reduce-fallback"
      );
      expect(staticFallback).toHaveClass(
        "bg-background",
        "max-md:block",
        "md:hidden",
        "motion-reduce:block"
      );
      expect(staticFallback).not.toHaveClass("md:block");

      const fixedHost = await waitFor(() =>
        screen.getByTestId("helvety-shell-light-pillar-fixed-host")
      );
      expect(fixedHost).toHaveClass("motion-reduce:hidden");

      const content = screen.getByTestId("helvety-shell-light-pillar-content");
      expect(content).toHaveClass("relative", "z-10");
      expect(content).toContainElement(screen.getByText("Shell content"));
    });

    it("unmounts WebGL when viewport becomes compact", async () => {
      const view = renderShell();

      await waitFor(() => {
        expect(
          screen.getByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeInTheDocument();
      });

      backdropMocks.isMobile = true;
      view.rerender(
        <HelvetyShellWithLightPillarBackdrop>
          <p>Shell content</p>
        </HelvetyShellWithLightPillarBackdrop>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeNull();
      });
    });
  });

  describe("skip WebGL (static bg-background fallback)", () => {
    it("skips mounting WebGL when prefers-reduced-motion", () => {
      vi.mocked(waitForShellContentPainted).mockClear();
      vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))
      );

      renderShell();

      expect(waitForShellContentPainted).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
      ).toBeNull();
      expect(
        screen.getByTestId("helvety-shell-light-pillar-reduce-fallback")
      ).toHaveClass("bg-background", "max-md:block", "md:block");
    });

    it("skips mounting WebGL on compact viewports", () => {
      backdropMocks.isMobile = true;
      vi.mocked(waitForShellContentPainted).mockClear();

      renderShell();

      expect(waitForShellContentPainted).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
      ).toBeNull();
      expect(
        screen.getByTestId("helvety-shell-light-pillar-reduce-fallback")
      ).toHaveClass("bg-background", "max-md:block", "md:block");
    });

    it("skips mounting WebGL in light mode on desktop", () => {
      backdropMocks.isDark = false;
      vi.mocked(waitForShellContentPainted).mockClear();

      renderShell();

      expect(waitForShellContentPainted).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
      ).toBeNull();
      expect(
        screen.getByTestId("helvety-shell-light-pillar-reduce-fallback")
      ).toHaveClass("bg-background", "md:block");
    });

    it("unmounts WebGL when theme switches to light", async () => {
      const view = renderShell();

      await waitFor(() => {
        expect(
          screen.getByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeInTheDocument();
      });

      backdropMocks.isDark = false;
      view.rerender(
        <HelvetyShellWithLightPillarBackdrop>
          <p>Shell content</p>
        </HelvetyShellWithLightPillarBackdrop>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeNull();
      });
    });

    it("mounts WebGL when theme switches from light to dark on desktop", async () => {
      backdropMocks.isDark = false;
      const view = render(
        <HelvetyShellWithLightPillarBackdrop>
          <p>Shell content</p>
        </HelvetyShellWithLightPillarBackdrop>
      );

      expect(
        screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
      ).toBeNull();

      backdropMocks.isDark = true;
      view.rerender(
        <HelvetyShellWithLightPillarBackdrop>
          <p>Shell content</p>
        </HelvetyShellWithLightPillarBackdrop>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("helvety-shell-light-pillar-fixed-host")
        ).toBeInTheDocument();
      });
    });
  });
});
