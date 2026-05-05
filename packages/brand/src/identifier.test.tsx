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
});
