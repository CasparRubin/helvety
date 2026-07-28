import { openMenuTrigger } from "@helvety/shared/test-utils/base-ui-test-helpers";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/products"),
}));

import { StoreNav } from "./store-nav";

describe("StoreNav", () => {
  it("uses solid CommandBar for readable section nav", () => {
    render(<StoreNav />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bg-surface-toolbar");
    expect(nav.className).not.toMatch(/bg-surface-toolbar\//);
    expect(nav).not.toHaveClass("backdrop-blur");
    expect(nav.className).not.toContain(
      "supports-[backdrop-filter]:bg-surface-toolbar/40"
    );
  });

  it("mobile section dropdown exposes Products Link menuitem with nativeButton={false}", async () => {
    render(<StoreNav />);

    const triggers = screen.getAllByRole("button", { name: /Products/i });
    const mobileTrigger = triggers.find((el) =>
      el.classList.contains("md:hidden")
    );
    expect(mobileTrigger).toBeDefined();
    openMenuTrigger(mobileTrigger!);

    const products = await screen.findByRole("menuitem", { name: /Products/i });
    expect(products).toHaveAttribute("href", "/products");
    expect(products).toHaveAttribute("role", "menuitem");
    expect(screen.queryByRole("menuitem", { name: /Account/i })).toBeNull();
  });
});
