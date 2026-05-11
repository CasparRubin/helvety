import { TooltipProvider } from "@helvety/ui/tooltip";
import { useNavbarAuthState } from "@helvety/ui/use-navbar-auth-state";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "./navbar";

import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

vi.mock("@helvety/ui/use-navbar-auth-state");

const mockUseEncryptionContext = vi.fn();

vi.mock("@helvety/shared/crypto/encryption-context", () => ({
  useEncryptionContext: () => mockUseEncryptionContext(),
}));

vi.mock("@helvety/shared/auth-redirect", () => ({
  redirectToLogin: vi.fn(),
  redirectToLogout: vi.fn(),
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

vi.mock("@/lib/config/version", () => ({
  VERSION: null as string | null,
}));

/** Renders `Navbar` inside `TooltipProvider` (required by shell tooltips). */
function renderAuthNavbar(initialUser: User | null = null) {
  return render(
    <TooltipProvider>
      <Navbar initialUser={initialUser} />
    </TooltipProvider>
  );
}

describe("Auth Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user: null,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: false,
      isLoading: true,
      unlockedForUserId: null,
    });
  });

  it("shows encryption badge when vault is unlocked for the signed-in user", () => {
    const user = { id: "user-42", email: "auth@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: false,
      unlockedForUserId: "user-42",
    });
    renderAuthNavbar(user);
    expect(screen.getAllByText("Encryption enabled").length).toBeGreaterThan(0);
  });

  it("hides encryption badge when vault is unlocked for a different user", () => {
    const user = { id: "user-42", email: "auth@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: false,
      unlockedForUserId: "other-user",
    });
    renderAuthNavbar(user);
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();
  });

  it("hides encryption badge while encryption context is loading", () => {
    const user = { id: "user-42", email: "auth@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: true,
      unlockedForUserId: "user-42",
    });
    renderAuthNavbar(user);
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();
  });

  it("about dialog scopes sign-in copy to helvety.com web apps", () => {
    renderAuthNavbar();
    fireEvent.click(screen.getByRole("button", { name: "Open about dialog" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Helvety web apps on helvety.com");
    expect(dialog).not.toHaveTextContent("all Helvety apps");
  });
});
