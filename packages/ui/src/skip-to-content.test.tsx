import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkipToContent } from "./skip-to-content";

describe("SkipToContent", () => {
  it("links to the main content landmark", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveAttribute("href", "#main-content");
  });
});
