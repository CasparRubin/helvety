import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "./product-card";

import type { Product } from "@/lib/types/products";

vi.mock("next/image", () => ({
  default: () => <span data-testid="product-card-image" />,
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

const product = {
  id: "helvety-pdf",
  slug: "helvety-pdf",
  name: "Helvety PDF",
  type: "saas",
  shortDescription: "Reorder and merge PDFs in your browser.",
  status: "available",
  category: "utilities",
  description: { intro: "Intro" },
  features: [],
  pricing: { tiers: [], hasFreeTier: true, hasYearlyPricing: false },
} as Product;

describe("ProductCard", () => {
  it("always exposes shortDescription on compact viewports (max-md grid row)", () => {
    const { container } = render(<ProductCard product={product} />);

    expect(
      screen.getByText("Reorder and merge PDFs in your browser.")
    ).toBeInTheDocument();

    expect(container.innerHTML).toContain("max-md:grid-rows-[1fr]");
    expect(container.innerHTML).toContain(
      "[@media(hover:hover)]:group-hover:grid-rows-[1fr]"
    );
  });

  it("links to the product detail route", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: /Helvety PDF/i })).toHaveAttribute(
      "href",
      "/products/helvety-pdf"
    );
  });
});
