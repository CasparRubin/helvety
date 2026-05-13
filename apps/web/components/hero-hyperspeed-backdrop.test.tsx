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
  it("lifts black veil after onReady (no fade on transparent WebGL layer)", async () => {
    const { container } = render(<HeroHyperspeedBackdrop />);

    expect(
      container.querySelector('[data-testid="stub-hyperspeed"]')
    ).not.toBeNull();

    const veil = container.querySelector(
      '[data-testid="hero-hyperspeed-veil"]'
    );
    expect(veil).not.toBeNull();

    await waitFor(
      () => {
        expect(veil).toHaveClass("opacity-0");
      },
      { timeout: 3000 }
    );
  });
});
