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
    prefetch,
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} data-prefetch={prefetch === false ? "false" : undefined}>
      {children}
    </a>
  ),
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
  pricing: { tiers: [], hasFreeTier: true },
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

  it("links to the product detail route without prefetching the detail page", () => {
    render(<ProductCard product={product} />);

    const link = screen.getByRole("link", { name: /Helvety PDF/i });
    expect(link).toHaveAttribute("href", "/products/helvety-pdf");
    expect(link).toHaveAttribute("data-prefetch", "false");
  });

  it("renders type and artist badges with readable surfaces over the artwork", () => {
    render(
      <ProductCard
        product={{
          ...product,
          artist: "Alexandre Calame",
        }}
      />
    );

    const typeBadge = screen.getByText("Web App");
    expect(typeBadge).toHaveAttribute("data-slot", "badge");
    expect(typeBadge).toHaveClass("bg-sky-500/15");

    const artistBadge = screen.getByText("Art by Alexandre Calame");
    expect(artistBadge).toHaveAttribute("data-slot", "badge");
    expect(artistBadge).toHaveClass("bg-card/90");
    expect(artistBadge).toHaveClass("backdrop-blur-sm");
  });
});
