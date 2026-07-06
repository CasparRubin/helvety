import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductsCatalog } from "./products-catalog";

import type * as ProductsModule from "@/lib/data/products";
import type { Product } from "@/lib/types/products";
import type { StoreProductCardEntry } from "@helvety/shared/store-catalog";

/** Maps test `Product` rows to SSR catalog card entries. */
function toInitialCards(products: Product[]): StoreProductCardEntry[] {
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    releaseDate: "2025-09-14",
    type: product.type,
    category: product.category,
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  })) as StoreProductCardEntry[];
}

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

const mockProducts: Product[] = [
  {
    id: "helvety-pdf",
    slug: "helvety-pdf",
    name: "Helvety PDF",
    type: "saas",
    shortDescription: "PDF in the browser",
    category: "file-tools",
    description: { intro: "Intro" },
    features: [],
    pricing: { tiers: [], hasFreeTier: true },
  },
  {
    id: "helvety-spo-explorer",
    slug: "helvety-spo-explorer",
    name: "Helvety SPO Explorer",
    type: "software",
    shortDescription: "SharePoint header extension",
    category: "sharepoint-apps",
    description: { intro: "Intro" },
    features: [],
    pricing: { tiers: [], hasFreeTier: true },
  },
];

vi.mock("@/lib/data/products", async (importOriginal) => {
  const actual: typeof ProductsModule = await importOriginal();
  return {
    ...actual,
    getAllProducts: vi.fn(() => mockProducts),
  };
});

describe("ProductsCatalog", () => {
  it("renders all products from getAllProducts", () => {
    render(<ProductsCatalog initialCards={toInitialCards(mockProducts)} />);

    expect(screen.getByText("Helvety PDF")).toBeInTheDocument();
    expect(screen.getByText("Helvety SPO Explorer")).toBeInTheDocument();
  });

  it("filters products by category using getFilteredProducts", () => {
    render(<ProductsCatalog initialCards={toInitialCards(mockProducts)} />);

    fireEvent.click(screen.getByRole("button", { name: /SharePoint Apps/i }));

    expect(screen.queryByText("Helvety PDF")).not.toBeInTheDocument();
    expect(screen.getByText("Helvety SPO Explorer")).toBeInTheDocument();
  });

  it("lists all five ecosystem category filters", () => {
    render(<ProductsCatalog initialCards={toInitialCards(mockProducts)} />);

    expect(
      screen.getByRole("button", { name: /Encryption Apps/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /File Tools/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Browser Extensions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /SharePoint Apps/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Desktop Apps/i })
    ).toBeInTheDocument();
  });
});
