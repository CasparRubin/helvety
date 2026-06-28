import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PopupHeader } from "./popup-header";

describe("PopupHeader", () => {
  it("renders the display name and version label", () => {
    render(
      <PopupHeader displayName="Helvety" version="1.2.3" iconSrc="/icon.png" />
    );

    expect(screen.getByText("Helvety")).toBeInTheDocument();
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });

  it("hides the version label when the version is the placeholder dash", () => {
    render(
      <PopupHeader displayName="Helvety" version="—" iconSrc="/icon.png" />
    );

    expect(screen.queryByText(/^v/)).toBeNull();
  });

  it("hides the version label when the version is omitted", () => {
    render(<PopupHeader displayName="Helvety" iconSrc="/icon.png" />);

    expect(screen.queryByText(/^v/)).toBeNull();
  });

  it("exposes the icon alt text and src when alt is provided", () => {
    render(
      <PopupHeader displayName="Helvety" iconSrc="/icon.png" iconAlt="Logo" />
    );

    const icon = screen.getByAltText("Logo");
    expect(icon).toHaveAttribute("src", "/icon.png");
    expect(icon).toHaveAttribute("aria-hidden", "false");
  });

  it("marks the icon decorative when alt text is empty", () => {
    const { container } = render(
      <PopupHeader displayName="Helvety" iconSrc="/icon.png" />
    );

    const icon = container.querySelector("img");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("alt", "");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
