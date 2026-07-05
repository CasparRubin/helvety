import { openMenuTrigger } from "@helvety/shared/test-utils/base-ui-test-helpers";
import { useNavbarAuthState } from "@helvety/ui/use-navbar-auth-state";
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

  it("mobile section dropdown exposes Link menuitems with nativeButton={false}", async () => {
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: { id: "u1", email: "dev@example.com" },
      isLoading: false,
    });

    render(<StoreNav />);

    const triggers = screen.getAllByRole("button", { name: /Products/i });
    const mobileTrigger = triggers.find((el) =>
      el.classList.contains("md:hidden")
    );
    expect(mobileTrigger).toBeDefined();
    openMenuTrigger(mobileTrigger!);

    const account = await screen.findByRole("menuitem", { name: /Account/i });
    expect(account).toHaveAttribute("href", "/account");
    expect(account).toHaveAttribute("role", "menuitem");
  });
});
