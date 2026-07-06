import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const heroMocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
  webglAvailable: true,
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => heroMocks.prefersReducedMotion,
}));

vi.mock("@helvety/light-pillar", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    canUseWebGL: () => heroMocks.webglAvailable,
  });
});

vi.mock("@/components/hero-hyperspeed-backdrop", () => ({
  HeroHyperspeedBackdrop: () => (
    <div data-testid="hero-hyperspeed-backdrop-mock" />
  ),
}));

import { HeroHyperspeedLayer } from "./hero-hyperspeed-layer";

describe("HeroHyperspeedLayer", () => {
  beforeEach(() => {
    heroMocks.prefersReducedMotion = false;
    heroMocks.webglAvailable = true;
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

  it("skips hyperspeed when WebGL is unavailable", () => {
    heroMocks.webglAvailable = false;
    render(<HeroHyperspeedLayer />);

    expect(
      screen.queryByTestId("hero-hyperspeed-host")
    ).not.toBeInTheDocument();
  });
});
