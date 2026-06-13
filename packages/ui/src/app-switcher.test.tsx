import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSwitcher } from "./app-switcher";
import { appSwitcherSections } from "./app-switcher-sections";
import { TooltipProvider } from "./tooltip";

import type { ReactNode } from "react";

const sectionTitles = appSwitcherSections.map((s) => s.title);
const expectedLinks = appSwitcherSections.flatMap((s) => s.links);

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
  it("renders all grouped headings", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    expect(
      screen.getByRole("heading", { name: "Helvety apps and tools" })
    ).toBeInTheDocument();

    for (const title of sectionTitles) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("renders absolute cross-zone hrefs for all navigation links", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    for (const link of expectedLinks) {
      expect(screen.getByRole("link", { name: link.name })).toHaveAttribute(
        "href",
        link.href
      );
    }
  });

  it("renders an icon for every navigation link", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    for (const link of expectedLinks) {
      const linkElement = screen.getByRole("link", { name: link.name });
      expect(linkElement.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("uses a scrollable sheet shell for long app lists", () => {
    render(
      <TooltipProvider>
        <AppSwitcher currentApp="Home" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch apps" }));

    const sheetContent = document.body.querySelector(
      '[data-slot="sheet-content"]'
    );
    expect(sheetContent?.className).toContain("overflow-hidden");
    expect(sheetContent?.className).toContain("gap-0");
    expect(
      document.body.querySelector('[data-slot="scroll-area"]')
    ).not.toBeNull();
  });
});
