import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppNotFound } from "./app-not-found";

describe("AppNotFound", () => {
  it("renders the 404 heading and home link", () => {
    render(<AppNotFound homeHref="/store" label="Back to Store" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page not found"
    );
    expect(
      screen.getByRole("button", { name: /Back to Store/i })
    ).toHaveAttribute("href", "/store");
  });
});
