import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const heroMocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => heroMocks.prefersReducedMotion,
}));

vi.mock("@/components/hero-hyperspeed-backdrop", () => ({
  HeroHyperspeedBackdrop: () => (
    <div data-testid="hero-hyperspeed-backdrop-mock" />
  ),
}));

import { HeroHyperspeedLayer } from "./hero-hyperspeed-layer";

describe("HeroHyperspeedLayer", () => {
  beforeEach(() => {
    heroMocks.prefersReducedMotion = false;
  });

  it("mounts hyperspeed host when motion is allowed", () => {
    render(<HeroHyperspeedLayer />);

    expect(screen.getByTestId("hero-hyperspeed-host")).toBeInTheDocument();
    expect(
      screen.getByTestId("hero-hyperspeed-backdrop-mock")
    ).toBeInTheDocument();
  });

  it("skips hyperspeed when prefers-reduced-motion is active", () => {
    heroMocks.prefersReducedMotion = true;
    render(<HeroHyperspeedLayer />);

    expect(
      screen.queryByTestId("hero-hyperspeed-host")
    ).not.toBeInTheDocument();
  });
});
