import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  NOTES_NAVBAR_ABOUT,
} from "@helvety/shared/app-navbar-about";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { E2eeAppNavbar } from "./e2ee-app-navbar";
import { TooltipProvider } from "./tooltip";
import { useNavbarAuthState } from "./use-navbar-auth-state";

import type { User } from "@supabase/supabase-js";

vi.mock("./use-navbar-auth-state");

const mockUseEncryptionContext = vi.fn();

vi.mock("@helvety/shared/crypto/encryption-context", () => ({
  useEncryptionContext: () => mockUseEncryptionContext(),
}));

const labels = {
  currentApp: "Notes",
  titleText: "Notes",
  encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
  aboutDescription: NOTES_NAVBAR_ABOUT,
  navigationMenuDescription: "Notes navigation menu",
} as const;

/** Renders `E2eeAppNavbar` with shared fixture labels. */
function renderE2ee(initialUser: User | null = null) {
  return render(
    <TooltipProvider>
      <E2eeAppNavbar
        initialUser={initialUser}
        labels={labels}
        versionLabel={null}
      />
    </TooltipProvider>
  );
}

describe("E2eeAppNavbar", () => {
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

  it("renders app title link from labels", () => {
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: false,
      isLoading: false,
      unlockedForUserId: null,
    });
    renderE2ee();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
  });

  it("shows encryption badge when unlocked for the signed-in user", () => {
    const user = { id: "user-42", email: "e2ee@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: false,
      unlockedForUserId: "user-42",
    });
    renderE2ee(user);
    expect(screen.getAllByText("Encryption enabled").length).toBeGreaterThan(0);
  });

  it("hides encryption badge when vault is unlocked for a different user", () => {
    const user = { id: "user-42", email: "e2ee@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: false,
      unlockedForUserId: "other-user",
    });
    renderE2ee(user);
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();
  });

  it("hides encryption badge while encryption context is loading", () => {
    const user = { id: "user-42", email: "e2ee@example.com" } as User;
    vi.mocked(useNavbarAuthState).mockReturnValue({
      user,
      isLoading: false,
    });
    mockUseEncryptionContext.mockReturnValue({
      isUnlocked: true,
      isLoading: true,
      unlockedForUserId: "user-42",
    });
    renderE2ee(user);
    expect(screen.queryByText("Encryption enabled")).not.toBeInTheDocument();
  });

  it("defaults loginReturnUrl to current for sign-in links", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "e2ee-app-navbar.tsx"),
      "utf8"
    );
    expect(src).toContain('loginReturnUrl = "current"');
    expect(src).toContain("loginReturnUrl={loginReturnUrl}");
  });
});
