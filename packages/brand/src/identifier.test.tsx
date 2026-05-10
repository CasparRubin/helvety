import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelvetyIdentifier } from "./identifier";

describe("HelvetyIdentifier", () => {
  it("renders an inline svg icon with expected defaults", () => {
    render(<HelvetyIdentifier data-testid="identifier" />);

    const identifier = screen.getByRole("img");
    expect(identifier).toHaveAttribute("viewBox", "0 0 500 500");
    expect(identifier).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    expect(screen.getByTestId("identifier")).toBe(identifier);
  });

  it("adds a gradient stroke path when edgeHighlight is true", () => {
    const { container } = render(
      <HelvetyIdentifier data-testid="identifier" edgeHighlight />
    );

    const edgeLayer = container.querySelector(".helvety-identifier-edge-shine");
    expect(edgeLayer).toBeTruthy();
    expect(edgeLayer).toHaveAttribute("fill", "none");
    expect(edgeLayer).toHaveAttribute("stroke");
    const filled = container.querySelectorAll(".helvety-identifier-mark");
    expect(filled.length).toBe(1);
  });
});
