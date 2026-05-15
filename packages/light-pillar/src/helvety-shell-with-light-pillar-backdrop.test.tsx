import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const backdropMocks = vi.hoisted(() => ({
  deferReady: false,
  fireReady: () => {},
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
  vi.unstubAllGlobals();
});

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
import { LIGHT_PILLAR_REVEAL_TRANSITION_CLASS } from "./light-pillar-reveal";
import { waitForShellContentPainted } from "./wait-for-shell-content-painted";

describe("HelvetyShellWithLightPillarBackdrop", () => {
  it("renders content immediately and defers backdrop until shell painted", async () => {
    render(
      <HelvetyShellWithLightPillarBackdrop>
        <p>Shell content</p>
      </HelvetyShellWithLightPillarBackdrop>
    );

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
    render(
      <HelvetyShellWithLightPillarBackdrop>
        <p>Shell content</p>
      </HelvetyShellWithLightPillarBackdrop>
    );

    const fixedHost = await waitFor(() =>
      screen.getByTestId("helvety-shell-light-pillar-fixed-host")
    );

    for (const token of LIGHT_PILLAR_REVEAL_TRANSITION_CLASS.split(/\s+/)) {
      expect(fixedHost).toHaveClass(token);
    }

    await waitFor(() => {
      expect(fixedHost).toHaveClass("opacity-100");
    });
  });

  it("keeps fixed host at opacity-0 until pillar onReady", async () => {
    backdropMocks.deferReady = true;

    render(
      <HelvetyShellWithLightPillarBackdrop>
        <p>Shell content</p>
      </HelvetyShellWithLightPillarBackdrop>
    );

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

  it("skips mounting WebGL when prefers-reduced-motion", () => {
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

    render(
      <HelvetyShellWithLightPillarBackdrop>
        <p>Shell content</p>
      </HelvetyShellWithLightPillarBackdrop>
    );

    expect(
      screen.queryByTestId("helvety-shell-light-pillar-fixed-host")
    ).toBeNull();
    expect(
      screen.getByTestId("helvety-shell-light-pillar-reduce-fallback")
    ).toHaveClass("motion-reduce:block");
  });

  it("pins shell content above backdrop and hides WebGL host under reduce motion", async () => {
    render(
      <HelvetyShellWithLightPillarBackdrop>
        <p>Shell content</p>
      </HelvetyShellWithLightPillarBackdrop>
    );

    const reduceFallback = screen.getByTestId(
      "helvety-shell-light-pillar-reduce-fallback"
    );
    expect(reduceFallback).toHaveClass("bg-background", "hidden");
    expect(reduceFallback).toHaveClass("motion-reduce:block");

    const fixedHost = await waitFor(() =>
      screen.getByTestId("helvety-shell-light-pillar-fixed-host")
    );
    expect(fixedHost).toHaveClass("motion-reduce:hidden");

    const content = screen.getByTestId("helvety-shell-light-pillar-content");
    expect(content).toHaveClass("relative", "z-10");
    expect(content).toContainElement(screen.getByText("Shell content"));
  });
});
