import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/products"),
}));

vi.mock("@helvety/ui/use-navbar-auth-state", () => ({
  useNavbarAuthState: vi.fn(() => ({ user: null })),
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
});
