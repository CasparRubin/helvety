import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelvetyMark } from "./helvety-mark";

describe("HelvetyMark", () => {
  it("renders the identifier svg with the default size classes", () => {
    const { container } = render(<HelvetyMark />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("h-8", "w-8", "shrink-0");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("merges a custom className with the defaults", () => {
    const { container } = render(<HelvetyMark className="text-primary" />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-8", "w-8", "shrink-0", "text-primary");
  });
});
