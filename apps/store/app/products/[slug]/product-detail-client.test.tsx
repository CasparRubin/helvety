import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => (
    <span role="img" aria-label={props.alt ?? ""} />
  ),
}));

import { ProductDetailClient } from "./product-detail-client";

describe("ProductDetailClient", () => {
  it("uses opaque surface panels for About and Installation over the shell backdrop", () => {
    render(
      <ProductDetailClient slug="helvety-power-automate-editor-version-enforcer" />
    );

    const about = document.getElementById("about");
    expect(about).toBeInTheDocument();
    expect(about).toHaveClass("bg-surface-panel");
    expect(about?.className).not.toContain("bg-surface-panel/40");

    const installationHeading = screen.getByRole("heading", {
      name: "Installation",
    });
    const installation = installationHeading.closest("section");
    expect(installation).toHaveClass("bg-surface-panel");
    expect(installation?.className).not.toContain("bg-surface-panel/40");
  });
});
