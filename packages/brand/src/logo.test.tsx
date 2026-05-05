import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelvetyLogo } from "./logo";

describe("HelvetyLogo", () => {
  it("renders an inline svg with expected defaults", () => {
    render(<HelvetyLogo data-testid="logo" />);

    const logo = screen.getByRole("img");
    expect(logo).toHaveAttribute("viewBox", "0 0 4000 1000");
    expect(logo).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    expect(screen.getByTestId("logo")).toBe(logo);
  });
});
