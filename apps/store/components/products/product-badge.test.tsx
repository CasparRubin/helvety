import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtistBadge, ProductBadge } from "./product-badge";

import type { ProductType } from "@/lib/types/products";

/** Asserts the element is a {@link @helvety/ui/badge} root and returns it. */
function expectBadge(element: HTMLElement): HTMLElement {
  expect(element).toHaveAttribute("data-slot", "badge");
  return element;
}

const productTypeExpectations = [
  {
    type: "saas" as const,
    label: "Web App",
    backgroundClass: "bg-sky-500/15",
    borderClass: "border-sky-500/35",
    textClass: "text-sky-950",
  },
  {
    type: "software" as const,
    label: "Software",
    backgroundClass: "bg-violet-500/15",
    borderClass: "border-violet-500/35",
    textClass: "text-violet-950",
  },
  {
    type: "physical" as const,
    label: "Physical",
    backgroundClass: "bg-amber-500/15",
    borderClass: "border-amber-500/35",
    textClass: "text-amber-950",
  },
] satisfies ReadonlyArray<{
  type: ProductType;
  label: string;
  backgroundClass: string;
  borderClass: string;
  textClass: string;
}>;

describe("ProductBadge", () => {
  it.each(productTypeExpectations)(
    "renders $label with a tinted outline surface for $type",
    ({ type, label, backgroundClass, borderClass, textClass }) => {
      render(<ProductBadge type={type} showIcon={false} />);

      const badge = expectBadge(screen.getByText(label));
      expect(badge).toHaveAttribute("data-variant", "outline");
      expect(badge).toHaveClass(backgroundClass);
      expect(badge).toHaveClass(borderClass);
      expect(badge).toHaveClass(textClass);
    }
  );

  it("renders the type icon when showIcon is true", () => {
    const { container } = render(<ProductBadge type="saas" />);
    expect(screen.getByText("Web App")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("merges optional className overrides", () => {
    render(
      <ProductBadge type="saas" showIcon={false} className="test-override" />
    );
    expect(screen.getByText("Web App")).toHaveClass("test-override");
  });
});

describe("ArtistBadge", () => {
  it("renders artwork credit with a frosted semi-opaque surface", () => {
    render(<ArtistBadge artist="Alexandre Calame" showIcon={false} />);

    const badge = expectBadge(screen.getByText("Art by Alexandre Calame"));
    expect(badge).toHaveAttribute("data-variant", "outline");
    expect(badge).toHaveClass("bg-card/90");
    expect(badge).toHaveClass("backdrop-blur-sm");
    expect(badge).toHaveClass("text-card-foreground");
    expect(badge).toHaveClass("shadow-sm");
    expect(badge).toHaveClass("border-border/60");
  });

  it("renders the palette icon when showIcon is true", () => {
    const { container } = render(<ArtistBadge artist="Rudolf Koller" />);
    expect(screen.getByText("Art by Rudolf Koller")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
