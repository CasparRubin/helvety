import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/store-light-pillar-backdrop", () => ({
  StoreLightPillarBackdrop: () => (
    <div data-testid="mock-store-light-pillar-backdrop" />
  ),
}));

import { StoreShellWithBackdrop } from "./store-shell-with-backdrop";

describe("StoreShellWithBackdrop", () => {
  it("renders backdrop behind shell children with reduced-motion fallback", () => {
    render(
      <StoreShellWithBackdrop>
        <p>Store shell</p>
      </StoreShellWithBackdrop>
    );

    expect(screen.getByText("Store shell")).toBeInTheDocument();
    expect(
      screen.getByTestId("mock-store-light-pillar-backdrop")
    ).toBeInTheDocument();

    const fixedHost = screen.getByTestId("store-shell-backdrop-fixed-host");
    expect(fixedHost).toHaveClass("motion-reduce:hidden");
    expect(fixedHost).toHaveClass("pointer-events-none", "fixed", "inset-0");

    const reduceFallback = screen.getByTestId(
      "store-shell-backdrop-reduce-fallback"
    );
    expect(reduceFallback).toHaveClass("bg-background", "hidden");
    expect(reduceFallback).toHaveClass("motion-reduce:block");

    const content = screen.getByTestId("store-shell-backdrop-content");
    expect(content).toHaveClass("relative", "z-10");
    expect(content).toContainElement(screen.getByText("Store shell"));
  });
});
