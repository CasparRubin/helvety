import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtistBadge, CategoryBadge, ReleaseDateBadge } from "./product-badge";

import type { ProductCategory } from "@/lib/types/products";

/** Asserts the element is a {@link @helvety/ui/badge} root and returns it. */
function expectBadge(element: HTMLElement): HTMLElement {
  expect(element).toHaveAttribute("data-slot", "badge");
  return element;
}

const categoryExpectations = [
  { category: "encryption-apps" as const, label: "Encryption Apps" },
  { category: "file-tools" as const, label: "File Tools" },
  { category: "browser-extensions" as const, label: "Browser Extensions" },
  { category: "sharepoint-apps" as const, label: "SharePoint Apps" },
  { category: "desktop-apps" as const, label: "Desktop Apps" },
] satisfies ReadonlyArray<{
  category: ProductCategory;
  label: string;
}>;

describe("CategoryBadge", () => {
  it.each(categoryExpectations)(
    "renders $label with a frosted overlay surface for $category",
    ({ category, label }) => {
      render(<CategoryBadge category={category} />);

      const badge = expectBadge(screen.getByText(label));
      expect(badge).toHaveAttribute("data-variant", "outline");
      expect(badge).toHaveClass("bg-card/90");
      expect(badge).toHaveClass("backdrop-blur-sm");
      expect(badge).toHaveClass("text-card-foreground");
    }
  );

  it("merges optional className overrides", () => {
    render(<CategoryBadge category="file-tools" className="test-override" />);
    expect(screen.getByText("File Tools")).toHaveClass("test-override");
  });
});

describe("ReleaseDateBadge", () => {
  it("renders a formatted date with a frosted overlay surface", () => {
    render(<ReleaseDateBadge isoDate="2025-09-14" showIcon={false} />);

    const badge = expectBadge(screen.getByText("Sep 14, 2025"));
    expect(badge).toHaveAttribute("data-variant", "outline");
    expect(badge).toHaveClass("bg-card/90");
    expect(badge).toHaveClass("backdrop-blur-sm");
    expect(badge).toHaveClass("text-card-foreground");
  });

  it("renders the calendar icon when showIcon is true", () => {
    const { container } = render(<ReleaseDateBadge isoDate="2025-09-14" />);
    expect(screen.getByText("Sep 14, 2025")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
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
