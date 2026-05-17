import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductsCatalog } from "./products-catalog";

import type { CatalogProduct } from "@/lib/data/catalog-product";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => (
    <span role="img" aria-label={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

/** Builds a minimal catalog row for component tests. */
function catalogProduct(
  overrides: Pick<
    CatalogProduct,
    "id" | "slug" | "name" | "type" | "shortDescription"
  >
): CatalogProduct {
  return {
    ...overrides,
    status: "available",
    category: "utilities",
  };
}

const initialProducts: CatalogProduct[] = [
  catalogProduct({
    id: "helvety-pdf",
    slug: "helvety-pdf",
    name: "Helvety PDF",
    type: "saas",
    shortDescription: "PDF in the browser",
  }),
  catalogProduct({
    id: "helvety-spo-explorer",
    slug: "helvety-spo-explorer",
    name: "Helvety SPO Explorer",
    type: "software",
    shortDescription: "SharePoint header extension",
  }),
];

describe("ProductsCatalog", () => {
  it("renders all initial products without calling client catalog loaders", () => {
    render(<ProductsCatalog initialProducts={initialProducts} />);

    expect(screen.getByText("Helvety PDF")).toBeInTheDocument();
    expect(screen.getByText("Helvety SPO Explorer")).toBeInTheDocument();
    expect(screen.getByText("PDF in the browser")).toBeInTheDocument();
    expect(screen.getByText("SharePoint header extension")).toBeInTheDocument();
  });

  it("filters products by type from the server-provided list", () => {
    render(<ProductsCatalog initialProducts={initialProducts} />);

    fireEvent.click(screen.getByRole("button", { name: /Software/i }));

    expect(screen.queryByText("Helvety PDF")).not.toBeInTheDocument();
    expect(screen.getByText("Helvety SPO Explorer")).toBeInTheDocument();
  });
});
