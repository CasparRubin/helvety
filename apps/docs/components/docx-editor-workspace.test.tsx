import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
};

describe("DocxEditorWorkspace", () => {
  beforeEach(() => {
    docxEditorMock.mockClear();
  });

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
        showToolbar: true,
        mode: "editing",
        showRuler: true,
        showZoomControl: true,
      })
    );
    expect(docxEditorMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        documentBuffer: expect.anything(),
      })
    );
  });

  it("remounts the editor when sessionKey changes", () => {
    const { rerender } = render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledTimes(1);

    rerender(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={2}
        {...chromeProps}
      />
    );

    expect(docxEditorMock).toHaveBeenCalledTimes(2);
  });

  it("does not inject Helvety actions into the Eigenpal title bar", () => {
    render(
      <DocxEditorWorkspace
        documentBuffer={null}
        sessionKey={1}
        {...chromeProps}
      />
    );

    const lastCall = docxEditorMock.mock.calls.at(-1)?.[0] as Record<
      string,
      unknown
    >;
    expect(lastCall.renderTitleBarRight).toBeUndefined();
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
