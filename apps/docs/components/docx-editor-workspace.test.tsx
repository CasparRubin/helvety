import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const docxEditorMock = vi.fn((_props: Record<string, unknown>) => null);

vi.mock("@eigenpal/docx-editor-react", () => ({
  createEmptyDocument: vi.fn(() => ({ type: "blank-document" })),
  DocxEditor: (props: Record<string, unknown>) => {
    docxEditorMock(props);
    return null;
  },
}));

import { DocxEditorWorkspace } from "./docx-editor-workspace";

const chromeProps = {
  documentName: "Untitled",
  onDocumentNameChange: vi.fn(),
  onDownload: vi.fn(),
  isSaving: false,
  canSaveToVault: false,
  vaultDocId: null,
  showMyDocuments: false,
  onNewDocument: vi.fn(),
  onOpenFile: vi.fn(),
  onDownloadFile: vi.fn(),
  onSaveToVault: vi.fn(),
  onOpenMyDocuments: vi.fn(),
};

describe("DocxEditorWorkspace", () => {
  it("passes createEmptyDocument output when no buffer is loaded", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        document: { type: "blank-document" },
        comments: [],
        onCommentsChange: expect.any(Function),
        documentName: "Untitled",
        onDocumentNameChange: chromeProps.onDocumentNameChange,
        onSave: expect.any(Function),
        renderTitleBarRight: expect.any(Function),
      })
    );
    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        documentBuffer: expect.anything(),
      })
    );
  });

  it("invokes renderTitleBarRight with title bar actions", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    const lastCall = docxEditorMock.mock.calls.at(-1)?.[0] as {
      renderTitleBarRight?: () => unknown;
    };
    expect(lastCall.renderTitleBarRight).toEqual(expect.any(Function));
    expect(lastCall.renderTitleBarRight?.()).toBeTruthy();
  });

  it("wires onSave to the download handler", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    const lastCall = docxEditorMock.mock.calls.at(-1)?.[0] as {
      onSave?: (buffer: ArrayBuffer) => void;
    };
    const buffer = new ArrayBuffer(8);
    lastCall.onSave?.(buffer);
    expect(chromeProps.onDownload).toHaveBeenCalledWith(buffer);
  });
});
