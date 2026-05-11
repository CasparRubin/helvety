import { urls } from "@helvety/shared/config";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSwitcher } from "./app-switcher";
import { TooltipProvider } from "./tooltip";

import type { ReactNode } from "react";

const sectionHeadings = [
  "Core Apps",
  "Encryption Apps",
  "File Tools",
  "Browser Extensions",
  "SharePoint Apps",
  "Desktop Apps",
] as const;

const expectedLinks = [
  { name: "Home", href: urls.home },
  { name: "Store", href: urls.store },
  { name: "Tasks", href: urls.tasks },
  { name: "Contacts", href: urls.contacts },
  { name: "Notes", href: urls.notes },
  { name: "PDF", href: urls.pdf },
  { name: "Image Upscaler", href: urls.imageUpscaler },
  {
    name: "Power Automate Force v3=false Browser Extension",
    href: `${urls.store}/products/helvety-power-automate-force-v3-false`,
  },
  {
    name: "Helvety SPO Explorer",
    href: `${urls.store}/products/helvety-spo-explorer`,
  },
  {
    name: "Helvety Screen Tools",
    href: `${urls.store}/products/helvety-screen-tools`,
  },
] as const;

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

    for (const heading of sectionHeadings) {
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
    }
  });

  it("renders expected absolute URLs for all ecosystem links", () => {
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

  it("renders an icon for every ecosystem link", () => {
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
});
