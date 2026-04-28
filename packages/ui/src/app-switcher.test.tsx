import { urls } from "@helvety/shared/config";
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
  it("renders absolute ecosystem URLs to avoid basePath nesting", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    expect(screen.getByRole("link", { name: "Store" })).toHaveAttribute(
      "href",
      urls.store
    );
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
      "href",
      urls.tasks
    );
    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "href",
      urls.contacts
    );
  });
});
