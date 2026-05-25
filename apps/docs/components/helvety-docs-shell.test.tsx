import { render, waitFor } from "@testing-library/react";
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
      (props: { showMyDocuments?: boolean }) => {
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

import type { User } from "@supabase/supabase-js";

describe("HelvetyDocsShell", () => {
  it("strips landing ?doc= without auto-opening vault documents", async () => {
    render(<HelvetyDocsShell initialUser={null} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });
    });
    expect(loadDocumentMock).not.toHaveBeenCalled();
  });

  it("passes title-bar chrome props to the editor workspace (guest)", () => {
    render(<HelvetyDocsShell initialUser={null} />);

    expect(workspacePropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentName: expect.any(String),
        onDocumentNameChange: expect.any(Function),
        onDownload: expect.any(Function),
        onDownloadFile: expect.any(Function),
        showMyDocuments: false,
        onNewDocument: expect.any(Function),
        onOpenFile: expect.any(Function),
        onSaveToVault: expect.any(Function),
        onOpenMyDocuments: expect.any(Function),
      })
    );
  });

  it("passes vault chrome props to the editor workspace when signed in", () => {
    render(
      <HelvetyDocsShell
        initialUser={{ id: "user-1", email: "user@example.com" } as User}
      />
    );

    expect(workspacePropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        showMyDocuments: true,
        onOpenMyDocuments: expect.any(Function),
      })
    );
  });
});
