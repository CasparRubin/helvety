import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductCard } from "./product-card";

import type { Product } from "@/lib/types/products";

vi.mock("next/image", () => ({
  default: ({ preload }: { preload?: boolean }) => (
    <span
      data-testid="product-card-image"
      data-preload={preload ? "true" : "false"}
    />
  ),
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
  category: "file-tools",
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

  it("links to the product detail route and lets Next prefetch it", () => {
    render(<ProductCard product={product} />);

    const link = screen.getByRole("link", { name: /Helvety PDF/i });
    expect(link).toHaveAttribute("href", "/products/helvety-pdf");
    expect(link).not.toHaveAttribute("data-prefetch", "false");
  });

  it("preloads artwork for the first row when asked", () => {
    render(
      <ProductCard product={{ ...product, image: "/artwork.webp" }} preload />
    );

    expect(screen.getByTestId("product-card-image")).toHaveAttribute(
      "data-preload",
      "true"
    );
  });

  it("renders category and artist badges with readable surfaces over the artwork", () => {
    render(
      <ProductCard
        product={{
          ...product,
          artist: "Alexandre Calame",
        }}
      />
    );

    const categoryBadge = screen.getByText("File Tools");
    expect(categoryBadge).toHaveAttribute("data-slot", "badge");
    expect(categoryBadge).toHaveClass("bg-card/90");
    expect(categoryBadge).toHaveClass("backdrop-blur-sm");

    const artistBadge = screen.getByText("Art by Alexandre Calame");
    expect(artistBadge).toHaveAttribute("data-slot", "badge");
    expect(artistBadge).toHaveClass("bg-card/90");
    expect(artistBadge).toHaveClass("backdrop-blur-sm");
  });
});
