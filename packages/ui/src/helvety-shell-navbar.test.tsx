import { urls } from "@helvety/shared/config";
import { assertLicenseFreeSeoCopy } from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HelvetyShellNavbar } from "./helvety-shell-navbar";
import { TooltipProvider } from "./tooltip";
import { useNavbarAuthState } from "./use-navbar-auth-state";

import type { ReactNode } from "react";

vi.mock("./use-navbar-auth-state");

const redirectToLogin = vi.fn();
const redirectToLogout = vi.fn();

vi.mock("@helvety/shared/auth-redirect", () => ({
  redirectToLogin: (...args: unknown[]) => redirectToLogin(...args),
  redirectToLogout: (...args: unknown[]) => redirectToLogout(...args),
}));

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
    account: { variant: "external-store" },
    ...props,
  };
  return render(
    <TooltipProvider>
      <HelvetyShellNavbar {...merged} />
    </TooltipProvider>
  );
}

describe("HelvetyShellNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: null,
      isLoading: false,
    });
  });

  it("renders Sign in when there is no session", () => {
    renderShell();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders the brand home link without opening a new tab", () => {
    renderShell();
    const home = screen.getByRole("link", { name: "Visit Helvety.com" });
    expect(home).toHaveAttribute("href", urls.home);
    expect(home).not.toHaveAttribute("target");
  });

  it("links to the Helvety GitHub repository with an accessible label", () => {
    renderShell();
    const github = screen.getByRole("button", {
      name: "View source code on GitHub",
    });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/CasparRubin/helvety"
    );
    expect(github).toHaveAttribute("target", "_blank");
  });

  it("renders profile menu trigger when authenticated", () => {
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: { id: "u1", email: "dev@example.com" },
      isLoading: false,
    });
    renderShell();
    expect(
      screen.getByRole("button", { name: "Open profile menu" })
    ).toBeInTheDocument();
  });

  it("shows encryption badge when encryption is a static object with loading false and showBadge true", () => {
    renderShell({
      encryption: {
        loading: false,
        showBadge: true,
        tooltipContent: (
          <>
            <p className="font-semibold">Client-Side Encryption</p>
            <p>Test tooltip body.</p>
          </>
        ),
      },
    });
    expect(screen.getAllByText("Encryption enabled").length).toBeGreaterThan(0);
    const shields = document.querySelectorAll(
      "svg.text-emerald-600.dark\\:text-emerald-400"
    );
    expect(shields.length).toBeGreaterThan(0);
    for (const shield of shields) {
      expect(shield).not.toHaveClass("text-primary");
    }
  });

  it("hides encryption badge while encryption.loading is true", () => {
    renderShell({
      encryption: {
        loading: true,
        showBadge: true,
        tooltipContent: <p>Should not show</p>,
      },
    });
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();
  });

  it("resolves encryption from auth snapshot when encryption is a function", () => {
    renderShell({
      encryption: ({ user }) => ({
        loading: false,
        showBadge: user?.id === "u1",
        tooltipContent: <p>E2EE-style tooltip</p>,
      }),
    });
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();

    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: { id: "u1", email: "x@y.z" },
      isLoading: false,
    });
    renderShell({
      encryption: ({ user }) => ({
        loading: false,
        showBadge: user?.id === "u1",
        tooltipContent: <p>E2EE-style tooltip</p>,
      }),
    });
    expect(screen.getAllByText("Encryption enabled").length).toBeGreaterThan(0);
  });

  it("About dialog does not mention software licenses", async () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open about dialog" }));
    const dialog = await screen.findByRole("dialog");
    assertLicenseFreeSeoCopy("About dialog", dialog.textContent ?? "");
    expect(dialog.textContent).toMatch(
      /engineered, designed, and made in Switzerland/i
    );
  });

  it("calls redirectToLogin with no args by default when Sign in is clicked", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
    expect(redirectToLogin).toHaveBeenCalledWith();
  });

  it("calls redirectToLogin with current URL when loginReturnUrl is current", () => {
    const href = "https://unit.test/auth/callback";
    vi.stubGlobal("location", { ...window.location, href });
    renderShell({ loginReturnUrl: "current" });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(redirectToLogin).toHaveBeenCalledWith(href);
    vi.unstubAllGlobals();
  });

  it("renders same-origin Account link when account variant is same-origin", () => {
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: { id: "u1", email: "dev@example.com" },
      isLoading: false,
    });
    renderShell({
      account: { variant: "same-origin", href: "/account" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open profile menu" }));
    const account = screen.getByRole("button", { name: /Account/i });
    expect(account).toHaveAttribute("href", "/account");
  });

  it("mobile menu sheet uses scrollable shell layout", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

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
