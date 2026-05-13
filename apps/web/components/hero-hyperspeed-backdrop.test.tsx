import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function SyncHyperspeedStub({ onReady }: { onReady?: () => void }) {
      useEffect(() => {
        requestAnimationFrame(() => {
          onReady?.();
        });
      }, [onReady]);
      return <div data-testid="stub-hyperspeed" id="lights" />;
    },
}));

import { HeroHyperspeedBackdrop } from "./hero-hyperspeed-backdrop";

describe("HeroHyperspeedBackdrop", () => {
  it("fades in the WebGL layer after onReady (first-frame signal)", async () => {
    const { container } = render(<HeroHyperspeedBackdrop />);

    expect(
      container.querySelector('[data-testid="stub-hyperspeed"]')
    ).not.toBeNull();

    const fadeLayer = container.querySelector(".transition-opacity");
    expect(fadeLayer).not.toBeNull();

    await waitFor(
      () => {
        expect(fadeLayer).toHaveClass("opacity-100");
        expect(fadeLayer).toHaveClass("pointer-events-auto");
      },
      { timeout: 3000 }
    );
  });
});
