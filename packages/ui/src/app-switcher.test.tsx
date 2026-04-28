import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSwitcher } from "./app-switcher";
import { TooltipProvider } from "./tooltip";

import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AppSwitcher", () => {
  it("renders path-based hrefs for ecosystem links", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    expect(screen.getByRole("link", { name: "Store" })).toHaveAttribute(
      "href",
      "/store"
    );
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
      "href",
      "/tasks"
    );
    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "href",
      "/contacts"
    );
  });
});
