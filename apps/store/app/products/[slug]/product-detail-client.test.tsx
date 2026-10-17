// @vitest-environment jsdom

import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getProductBySlug } from "@/lib/data/products";

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

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => (
    <span role="img" aria-label={props.alt ?? ""} />
  ),
}));

import { ProductDetailClient } from "./product-detail-client";

/** Renders a catalog product by slug with its resolved server payload. */
function renderProduct(slug: string) {
  const product = getProductBySlug(slug);
  if (!product) {
    throw new Error(`Missing test product: ${slug}`);
  }
  return render(<ProductDetailClient product={product} />);
}

describe("ProductDetailClient", () => {
  it("renders package downloads as direct links", () => {
    renderProduct("helvety-spo-explorer");

    const download = screen.getByRole("button", { name: /Download \.sppkg/i });
    expect(download).toHaveAttribute(
      "href",
      "/store/api/packages/spo-explorer/download"
    );
  });

  it("does not render a package download control for SaaS products", () => {
    renderProduct("helvety-pdf");

    expect(
      screen.queryByRole("button", { name: /Download \./i })
    ).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="/api/packages/"]')).toBeNull();
  });

  it("renders Chrome Web Store and GitHub links without a package download for Power Platform Configurator", () => {
    renderProduct("helvety-power-platform-configurator");

    const chromeWebStore = screen.getByRole("button", {
      name: /Add to Chrome/i,
    });
    expect(chromeWebStore).toHaveAttribute(
      "href",
      POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL
    );
    expect(chromeWebStore).toHaveAttribute("target", "_blank");

    const github = screen.getByRole("button", {
      name: /View source code on GitHub/i,
    });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium"
    );

    expect(
      screen.queryByRole("button", { name: /Download \./i })
    ).not.toBeInTheDocument();
  });

  it("uses opaque surface panels for About and Installation", () => {
    renderProduct("helvety-power-platform-configurator");

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

  it("lists core and module zip downloads for Power Platform Tools", () => {
    renderProduct("helvety-power-platform-tools");

    const coreDownload = screen.getByRole("button", {
      name: /^Download \.zip$/i,
    });
    expect(coreDownload).toHaveAttribute(
      "href",
      "/store/api/packages/power-platform-tools/download"
    );

    const modules = document.getElementById("modules");
    expect(modules).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Flow Explorer" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Web Resource Explorer" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Data Model Explorer" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Download Flow Explorer \.zip/i,
      })
    ).toHaveAttribute("href", "/store/api/packages/flow-explorer/download");

    expect(
      screen.getByRole("button", {
        name: /Download Web Resource Explorer \.zip/i,
      })
    ).toHaveAttribute(
      "href",
      "/store/api/packages/web-resource-explorer/download"
    );

    expect(
      screen.getByRole("button", {
        name: /Download Data Model Explorer \.zip/i,
      })
    ).toHaveAttribute(
      "href",
      "/store/api/packages/data-model-explorer/download"
    );
  });
});
