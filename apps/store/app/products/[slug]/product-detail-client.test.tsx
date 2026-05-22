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
  it("uses a click-only download button without a prefetchable package href", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });

    render(<ProductDetailClient slug="helvety-spo-explorer" />);

    const download = screen.getByRole("button", { name: /Download \.sppkg/i });
    expect(download).not.toHaveAttribute("href");
    expect(document.querySelector('a[href*="/api/packages/"]')).toBeNull();

    download.click();
    expect(assign).toHaveBeenCalledWith(
      "/store/api/packages/spo-explorer/download"
    );

    vi.unstubAllGlobals();
  });

  it("does not render a package download control for SaaS products", () => {
    render(<ProductDetailClient slug="helvety-pdf" />);

    expect(
      screen.queryByRole("button", { name: /Download \./i })
    ).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="/api/packages/"]')).toBeNull();
  });

  it("renders a GitHub source link when the product lists a repository URL", () => {
    render(
      <ProductDetailClient slug="helvety-power-platform-configurator" />
    );

    const github = screen.getByRole("link", {
      name: /View source code on GitHub/i,
    });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/CasparRubin/power-platform-configurator"
    );
    expect(github).toHaveAttribute("target", "_blank");
  });

  it("uses opaque surface panels for About and Installation", () => {
    render(
      <ProductDetailClient slug="helvety-power-platform-configurator" />
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
