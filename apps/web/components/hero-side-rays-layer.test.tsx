import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canUseWebGL: vi.fn(() => true),
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("@helvety/light-pillar", () => ({
  canUseWebGL: () => mocks.canUseWebGL(),
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => mocks.useReducedMotion(),
}));

vi.mock("@/components/hero-side-rays-backdrop", () => ({
  HeroSideRaysBackdrop: () => (
    <div data-testid="hero-side-rays-backdrop-mock" />
  ),
}));

import { HeroSideRaysLayer } from "./hero-side-rays-layer";

describe("HeroSideRaysLayer", () => {
  beforeEach(() => {
    mocks.canUseWebGL.mockReturnValue(true);
    mocks.useReducedMotion.mockReturnValue(false);
  });

  it("mounts the side-rays host when motion is allowed", () => {
    render(<HeroSideRaysLayer />);

    const host = screen.getByTestId("hero-side-rays-host");
    expect(host).toBeInTheDocument();
    expect(host).toHaveClass("hero-side-rays-bleed");
    expect(host).toHaveClass("motion-reduce:hidden");
    expect(host).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByTestId("hero-side-rays-backdrop-mock")
    ).toBeInTheDocument();
  });

  it("skips side rays when prefers-reduced-motion is active", () => {
    mocks.useReducedMotion.mockReturnValue(true);

    render(<HeroSideRaysLayer />);

    expect(screen.queryByTestId("hero-side-rays-host")).not.toBeInTheDocument();
  });

  it("skips side rays when WebGL is unavailable", () => {
    mocks.canUseWebGL.mockReturnValue(false);

    render(<HeroSideRaysLayer />);

    expect(screen.queryByTestId("hero-side-rays-host")).not.toBeInTheDocument();
  });
});
