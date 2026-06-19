import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VaultDocumentsSheet } from "./vault-documents-sheet";

import type { DocListItem } from "@/lib/types";
import type { User } from "@helvety/shared/supabase-types";
import type { ReactNode } from "react";

vi.mock("@helvety/ui/encryption-gate-app", () => ({
  EncryptionGateApp: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const testUser = { id: "user-1", email: "user@example.com" } as User;

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  initialUser: testUser,
  activeDocId: null as string | null,
  documents: [] as DocListItem[],
  isLoading: false,
  isRefreshing: false,
  error: null as string | null,
  onRetry: vi.fn(),
  vaultEnabled: true,
  onOpenDocument: vi.fn(),
  onDeleteDocument: vi.fn(),
};

describe("VaultDocumentsSheet", () => {
  it("shows list error state with retry when vault fetch fails", () => {
    const onRetry = vi.fn();

    render(
      <VaultDocumentsSheet
        {...baseProps}
        error="Vault list unavailable"
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Vault list unavailable"
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("uses command bar copy in the vault empty state", () => {
    render(<VaultDocumentsSheet {...baseProps} />);

    expect(
      screen.getByText("Save from the command bar when your vault is unlocked.")
    ).toBeInTheDocument();
  });
});
