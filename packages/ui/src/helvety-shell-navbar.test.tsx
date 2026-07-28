import { urls } from "@helvety/shared/config";
import { assertLicenseFreeSeoCopy } from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelvetyShellNavbar } from "./helvety-shell-navbar";
import { TooltipProvider } from "./tooltip";

import type { ReactNode } from "react";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

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

const defaultBrand = {
  currentApp: "PDF",
  homeHref: urls.home,
  homeAriaLabel: "Visit Helvety.com",
  titleText: "PDF",
  titleHref: "/" as const,
};

/** Renders `HelvetyShellNavbar` with defaults and `TooltipProvider`. */
function renderShell(
  props: Partial<React.ComponentProps<typeof HelvetyShellNavbar>> = {}
) {
  const merged: React.ComponentProps<typeof HelvetyShellNavbar> = {
    brand: defaultBrand,
    aboutDescription: "Test product copy for the About dialog.",
    navigationMenuDescription: "Test navigation menu",
    versionLabel: null,
    ...props,
  };
  return render(
    <TooltipProvider>
      <HelvetyShellNavbar {...merged} />
    </TooltipProvider>
  );
}

describe("HelvetyShellNavbar", () => {
  it("renders About and GitHub without sign-in controls", () => {
    renderShell();
    expect(screen.getByLabelText("Open about dialog")).toBeInTheDocument();
    expect(
      screen.getByLabelText("View source code on GitHub")
    ).toBeInTheDocument();
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
  });

  it("opens About dialog with product copy", () => {
    renderShell({ aboutDescription: "PDF about copy." });
    fireEvent.click(screen.getByLabelText("Open about dialog"));
    expect(screen.getByText("PDF about copy.")).toBeInTheDocument();
    assertLicenseFreeSeoCopy(
      "about",
      screen.getByText("PDF about copy.").textContent ?? ""
    );
  });
});
