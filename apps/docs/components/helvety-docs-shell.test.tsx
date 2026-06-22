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

const workspacePropsMock = vi.fn();

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockDocxEditorWorkspace = forwardRef(
      (props: Record<string, unknown>) => {
        workspacePropsMock(props);
        return <div data-testid="docx-editor-workspace" />;
      }
    );
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

import type { User } from "@helvety/shared/supabase-types";

describe("HelvetyDocsShell", () => {
  it("strips landing ?doc= without auto-opening vault documents", async () => {
    render(<HelvetyDocsShell initialUser={null} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });
    });
    expect(loadDocumentMock).not.toHaveBeenCalled();
  });

  it("passes document chrome props only to the editor workspace (guest)", () => {
    render(<HelvetyDocsShell initialUser={null} />);

    expect(workspacePropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentName: expect.any(String),
        onDocumentNameChange: expect.any(Function),
        onDownload: expect.any(Function),
      })
    );
    expect(workspacePropsMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        showMyDocuments: expect.anything(),
        onNewDocument: expect.any(Function),
      })
    );
    expect(
      screen.getByRole("button", { name: "New document" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "My documents" })
    ).not.toBeInTheDocument();
  });

  it("keeps the same onDownload reference across shell rerenders", () => {
    const { rerender } = render(<HelvetyDocsShell initialUser={null} />);

    const firstDownload = (
      workspacePropsMock.mock.calls.at(-1)?.[0] as {
        onDownload?: unknown;
      }
    ).onDownload;

    rerender(<HelvetyDocsShell initialUser={null} />);

    const secondDownload = (
      workspacePropsMock.mock.calls.at(-1)?.[0] as {
        onDownload?: unknown;
      }
    ).onDownload;

    expect(firstDownload).toBeTypeOf("function");
    expect(secondDownload).toBe(firstDownload);
  });

  it("shows vault actions in the command bar when signed in", () => {
    render(
      <HelvetyDocsShell
        initialUser={{ id: "user-1", email: "user@example.com" } as User}
      />
    );

    expect(
      screen.getByRole("button", { name: "My documents" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save to vault" })
    ).toBeInTheDocument();
  });
});
