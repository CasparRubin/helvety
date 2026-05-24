import { render, screen, waitFor } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const loadDocumentMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/",
  useSearchParams: () =>
    new URLSearchParams("doc=550e8400-e29b-41d4-a716-446655440000"),
}));

vi.mock("@helvety/shared/crypto/encryption-context", () => ({
  useEncryptionContext: () => ({ isUnlocked: false }),
}));

vi.mock("@/hooks/use-docs", () => ({
  useDocs: () => ({
    documents: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(),
    loadDocument: loadDocumentMock,
    saveDocument: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockDocxEditorWorkspace = forwardRef(() => (
      <div data-testid="docx-editor-workspace" />
    ));
    MockDocxEditorWorkspace.displayName = "MockDocxEditorWorkspace";
    return MockDocxEditorWorkspace;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { HelvetyDocsShell } from "./helvety-docs-shell";

import type { User } from "@supabase/supabase-js";

describe("HelvetyDocsShell", () => {
  it("strips landing ?doc= without auto-opening vault documents", async () => {
    render(<HelvetyDocsShell initialUser={null} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });
    });
    expect(loadDocumentMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Download document" })
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "My documents" })
    ).not.toBeInTheDocument();
  });

  it("shows My documents in the command bar when signed in", () => {
    render(
      <HelvetyDocsShell
        initialUser={{ id: "user-1", email: "user@example.com" } as User}
      />
    );

    expect(
      screen.getByRole("button", { name: "My documents" })
    ).toBeInTheDocument();
  });
});
