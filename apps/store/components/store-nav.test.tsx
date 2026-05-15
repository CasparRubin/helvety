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
  it("uses translucent CommandBar so section nav sits over the shell backdrop", () => {
    render(<StoreNav />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("backdrop-blur");
    expect(nav).toHaveClass("bg-surface-toolbar/65");
    expect(nav).not.toHaveClass("bg-surface-toolbar");
  });
});
